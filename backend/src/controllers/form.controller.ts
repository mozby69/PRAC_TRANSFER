import { Prisma, PrismaClient, Statuses } from "@prisma/client";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import { findNextApprover } from "../utils/FindNextApprover";
import { FindRequestSequence, RequestSequenceChecker } from "../utils/RequestHelper";
import { formatRefId } from "../utils/idConverter";


const prisma = new PrismaClient();

const toNum = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export const addFundTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = toNum(req.user?.id);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { requestContent, requestDate, requestFromId, requestTypeId, requestToId } = req.body ?? {};

    if (!requestContent || !requestFromId || !requestTypeId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Step 1: request type definition
    const reqType = await prisma.requestType.findUnique({
      where: { id: Number(requestTypeId) },
      select: {
        notedBy: { select: { id: true, name: true } },       // 👈 join to user
        checkedBy: { select: { id: true,  name: true} },
        checkedBy2: { select: { id: true, name: true } },
        recomApproval: { select: { id: true, name: true } },
        recomApproval2: { select: { id: true, name: true } },
        approveBy: { select: { id: true, name: true } },
        requestName: true,
      },
    });

    if (!reqType) {
      return res.status(404).json({ message: "RequestType not found" });
    }

    // Step 2: create main request
    const created = await prisma.mainRequest.create({
      data: {
        requestDate: requestDate ? new Date(requestDate) : new Date(),
        requestType: { connect: { id: Number(requestTypeId) } },
        requestFrom: { connect: { id: Number(requestFromId) } },
        referenceCode: "temp",
        requestBy: { connect: { id: userId } },
        fundTransfer: {
          create: {
            requestContent,
            requestToId,
          },
        },
        approval: {
          create: {
            notedBy: reqType.notedBy?.id ? "PENDING" : "EMPTY",
            checkedBy: reqType.checkedBy?.id ? "PENDING" : "EMPTY",
            checkedBy2: reqType.checkedBy2?.id ? "PENDING" : "EMPTY",
            recomApproval: reqType.recomApproval?.id ? "PENDING" : "EMPTY",
            recomApproval2: reqType.recomApproval2?.id ? "PENDING" : "EMPTY",
            approveBy: reqType.approveBy?.id ? "PENDING" : "EMPTY",
            requestLogs: {
                create: {
                  approverId: userId, 
                  checkerType: reqType.requestName,
                  action: "Submit Request",
              }
            } 
          },
        },
        
      },
      include: { fundTransfer: true, approval: true },
    });

      const referenceCode = formatRefId(created.id, "REF", 6);
      // Step 3: Update the record
      const updateRefCOde = await prisma.mainRequest.update({
        where: { id: created.id },
        data: { referenceCode: referenceCode },
      });

    const io = req.app.get("io");
    const nextApproverId = findNextApprover(reqType, created.approval[0]); 

    if (nextApproverId) {
      console.log(`🔔 Emitting new_request to user_${nextApproverId}`);
      io.to(`user_${nextApproverId}`).emit("new_request", {
        receiverId: nextApproverId,
        requestId: created.id,
        content: created.fundTransfer?.requestContent,
      });
      console.log(`sending to user_${nextApproverId}`);
    } else {
      console.log("no sender");
    }

    return res.status(201).json({ message: "Created", data: created });
  } catch (err) {
    console.error("Error creating fund transfer:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};




export const getRequestsForApprover = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Fetch requests with all approvals
    const requests = await prisma.mainRequest.findMany({
      where: {
        approval: {
          some: {
            OR: [
              { notedBy: "PENDING" },
              { checkedBy: "PENDING" },
              { checkedBy2: "PENDING" },
              { recomApproval: "PENDING" },
              { recomApproval2: "PENDING" },
              { approveBy: "PENDING" },
            ],
          },
        },
      },
      include: {
        fundTransfer: true,
        approval: true,
        requestFrom: true,
        requestType: {
          include: {
            notedBy: true,
            checkedBy: true,
            checkedBy2: true,
            recomApproval: true,
            recomApproval2: true,
            approveBy: true,
          },
        },
        requestBy: { select: { id: true, name: true } },
      },

      orderBy: {
        id: 'desc',   
      },
    });

    // Filter: only keep requests where the NEXT approver is this user
    const filtered = requests.filter((req) => {
      const approverId = findNextApprover(req.requestType, req.approval[0]); 
      return approverId === userId;
    });
    
    return res.json({ data: filtered });

  } catch (err) {
    console.error("Error fetching approver requests:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// ✅ Build a reusable type for mainRequest with relations
type MainRequestWithRelations = Prisma.MainRequestGetPayload<{
  include: {
    fundTransfer: true;
    travelOrder: true;
    proposedBudget:true;
    transmittalMemo:true;
    disburse:true;
    approval: true;
    requestFrom: true;
    requestType: {
      include: {
        notedBy: true;
        checkedBy: true;
        checkedBy2: true;
        recomApproval: true;
        recomApproval2: true;
        approveBy: true;
      };
    };
    requestBy: { select: { id: true; name: true } };
  };
}>;

// ✅ Helper to check if user has already acted
function hasUserWithStatus(
  req: MainRequestWithRelations,
  userId: number,
  status: string
): boolean {
  const approval = req.approval[0];
  const type = req.requestType;
  console.log("approval", approval)
  console.log("type", type);

  const sequenceNumber = FindRequestSequence(type, userId);
  if(sequenceNumber === null) return false
  


  const sequenceNumber1 = RequestSequenceChecker(sequenceNumber, approval, status);

  return sequenceNumber1;
}

// ✅ Controller to get requests where user has already acted (with pagination)
export const getRequestsByUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // --- Query params ---
    const status = (req.query.status as string)?.toUpperCase() || "PENDING";
    const page = parseInt((req.query.page as string) || "1", 10);
    const pageSize = parseInt((req.query.pageSize as string) || "10", 10);

    // Validate status
    const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
 
    // --- Fetch all requests (could optimize further w/ Prisma filtering) ---
    const requests: MainRequestWithRelations[] = await prisma.mainRequest.findMany({
      include: {
        travelOrder:true,
        proposedBudget:true,
        disburse:{
          include:{
            requestTo:{select:{name:true,position:true}}
          }
        },
        transmittalMemo:{
          include:{
            requestTo:{select:{name:true,position:true}}
          }
        },
        fundTransfer: {
          include: {
            requestTo: 
             {select: {name: true, position: true}},
          }
        },
        approval: true,
        requestFrom: true,
        requestType: {
          include: {
            notedBy:{
              select: {
                id: true,
                initial: true,
                name: true,
                position: true,
              }
            },
            checkedBy: true,
            checkedBy2: {
              select: {
                id: true,
                initial: true,
                name: true,
                position: true,
              }
            },
            recomApproval: {
              select: {
                id: true,
                initial: true,
                name: true,
                position: true,
              }
            },
            recomApproval2: {
              select: {
                id: true,
                initial: true,
                name: true,
                position: true,
              }
            },
            approveBy: {
              select: {
                id: true,
                initial: true,
                name: true,
                position: true,
              }
            }
          },
        },
        requestBy: { select: { id: true, name: true, position: true } }, 
      },
      orderBy: { id: "desc" },
    });

    // --- Filter user-specific requests ---
    const filtered = requests.filter((r) =>
      hasUserWithStatus(r, userId, status)
    );

    // --- Pagination ---
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = filtered.slice(start, end);

    return res.json({
      data: paginated,
      status,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error("Error fetching requests by status:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};



export const actOnRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const { action } = req.body; // "APPROVED" | "REJECTED"

    if (!["APPROVED", "REJECTED"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    // Find the request and approval row
    const request = await prisma.mainRequest.findUnique({
      where: { id: Number(id) },
      include: {
        approval: true,
        requestType: {
          include: {
            notedBy: true,
            checkedBy: true,
            checkedBy2: true,
            recomApproval: true,
            recomApproval2: true,
            approveBy: true,
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const approval = request.approval[0];
    const type = request.requestType;
    if (!approval || !type) {
      return res.status(400).json({ message: "Invalid request setup" });
    }

    // ✅ Figure out which field this user is responsible for
    let updateData: any = {};
    if (type.notedBy?.id === userId) updateData.notedBy = action;
    if (type.checkedBy?.id === userId) updateData.checkedBy = action;
    if (type.checkedBy2?.id === userId) updateData.checkedBy2 = action;
    if (type.recomApproval?.id === userId) updateData.recomApproval = action;
    if (type.recomApproval2?.id === userId) updateData.recomApproval2 = action;
    if (type.approveBy?.id === userId) updateData.approveBy = action;

    if (Object.keys(updateData).length === 0) {
      return res.status(403).json({ message: "You are not an approver for this request" });
    }

    // ✅ Update approval row
    await prisma.approvalTable.update({
      where: { id: approval.id },
      data: updateData,
    });
    return res.json({ message: `Request ${action} successfully` });
  } catch (err) {
    console.error("Error approving/rejecting request:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};






export const saveTravelOrderForm = async (req: AuthRequest, res: Response) => {
  try {
    const userId = toNum(req.user?.id);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { name, position, departure_date,destination,current_date,purpose,items,requestTypeId,requestFromId } = req.body ?? {};

    

    if (!requestTypeId) {
      return res.status(400).json({ message: "Missing requestTypeId" });
    }

    const dep = departure_date ? new Date(departure_date) : new Date();
    const cur = current_date ? new Date(current_date) : new Date();
    if (isNaN(dep.getTime()) || isNaN(cur.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const total = Array.isArray(items)
      ? items.reduce((sum: number, it: any) => {
          const n = parseFloat(String(it?.amount ?? "0"));
          return sum + (Number.isFinite(n) ? n : 0);
        }, 0)
      : 0;

    // Step 1: fetch request type approvers
    const reqType = await prisma.requestType.findUnique({
      where: { id: Number(requestTypeId) },
      select: {
        notedBy: { select: { id: true } },
        checkedBy: { select: { id: true } },
        checkedBy2: { select: { id: true } },
        recomApproval: { select: { id: true } },
        recomApproval2: { select: { id: true } },
        approveBy: { select: { id: true } },
      },
    });

    if (!reqType) {
      return res.status(404).json({ message: "RequestType not found" });
    }

 
    const createData: any = {
      requestDate: cur,
      requestType: { connect: { id: Number(requestTypeId) } },
      requestBy: { connect: { id: userId } },
      remarks: "travel_order",
      referenceCode:"temp",
      travelOrder: {
        create: {
          name: name || "Unknown",
          position: position || "Unknown",
          departure_date: dep,
          current_date: cur,
          destination: destination || "Unknown",
          purpose_of_travel: purpose || "Unknown",
          items: items || [],
          total_amount: total,
        },
      },
      approval: {
        create: {
          notedBy: reqType.notedBy?.id ? "PENDING" : "EMPTY",
          checkedBy: reqType.checkedBy?.id ? "PENDING" : "EMPTY",
          checkedBy2: reqType.checkedBy2?.id ? "PENDING" : "EMPTY",
          recomApproval: reqType.recomApproval?.id ? "PENDING" : "EMPTY",
          recomApproval2: reqType.recomApproval2?.id ? "PENDING" : "EMPTY",
          approveBy: reqType.approveBy?.id ? "PENDING" : "EMPTY",
        },
      },
    };


    if (requestFromId && !isNaN(Number(requestFromId))) {
      createData.requestFrom = { connect: { id: Number(requestFromId) } };
    }

    const created = await prisma.mainRequest.create({
      data: createData,
      include: { travelOrder: true, approval: true },
    });

    
    const referenceCode = formatRefId(created.id, "REF", 6);
   
    const updateRefCOde = await prisma.mainRequest.update({
      where: { id: created.id },
      data: { referenceCode: referenceCode },
    });


    const io = req.app.get("io");
    const nextApproverId = findNextApprover(reqType, created.approval[0]); 

    if (nextApproverId) {
      console.log(`🔔 Emitting new_request to user_${nextApproverId}`);
      io.to(`user_${nextApproverId}`).emit("new_request", {
        receiverId: nextApproverId,
        requestId: created.id,
        content: created.travelOrder?.name,
      });
      console.log(`sending to user_${nextApproverId}`);
    } else {
      console.log("no sender");
    }

    res.status(201).json({ message: "successfully added", created });
  } catch (error) {
    console.error("saveTravelOrderForm error:", error);
    res.status(500).json({ message: "error occurred" });
  }
};

















export const saveProposeBudgetForm = async (req: AuthRequest, res: Response) => {
  try {
    const userId = toNum(req.user?.id);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const normalizeDecimal = (val: any) =>
      val === "" || val === undefined ? null : val;

    const {items, requestTypeId: rootTypeId, requestFromId } = req.body ?? {};


    const requestTypeId = rootTypeId ?? items?.[0]?.requestTypeId;

    if (!requestTypeId) {
      return res.status(400).json({ message: "Missing requestTypeId" });
    }

   
    const incomingItems: any[] = Array.isArray(items)
      ? items
      : req.body && (req.body.description || req.body.expense_type || req.body.month_of)
      ? [req.body]
      : [];

    if (incomingItems.length === 0) {
      return res.status(400).json({
        message: "items (array) is required or send a single item body",
      });
    }

    
    const reqType = await prisma.requestType.findUnique({
      where: { id: Number(requestTypeId) },
      select: {
        notedBy: { select: { id: true } },
        checkedBy: { select: { id: true } },
        checkedBy2: { select: { id: true } },
        recomApproval: { select: { id: true } },
        recomApproval2: { select: { id: true } },
        approveBy: { select: { id: true } },
      },
    });

    if (!reqType) {
      return res.status(404).json({ message: "RequestType not found" });
    }


    const createData: any = {
      requestDate: new Date(),
      requestType: { connect: { id: Number(requestTypeId) } },
      requestBy: { connect: { id: userId } },
      remarks: "proposed_budget",
      referenceCode:"temp",
      approval: {
        create: {
          notedBy: reqType.notedBy?.id ? "PENDING" : "EMPTY",
          checkedBy: reqType.checkedBy?.id ? "PENDING" : "EMPTY",
          checkedBy2: reqType.checkedBy2?.id ? "PENDING" : "EMPTY",
          recomApproval: reqType.recomApproval?.id ? "PENDING" : "EMPTY",
          recomApproval2: reqType.recomApproval2?.id ? "PENDING" : "EMPTY",
          approveBy: reqType.approveBy?.id ? "PENDING" : "EMPTY",
        },
      },
      proposedBudget: {
        create: incomingItems.map((it) => ({
          description: it?.description ?? null,
          budget: normalizeDecimal(it?.budget),
          total_expenses: normalizeDecimal(it?.total_expenses),
          variance: normalizeDecimal(it?.variance),
          proposed_budget: normalizeDecimal(it?.proposed_budget),
          remarks: it?.remarks ?? null,
          expense_type: it?.expense_type ?? null,
          month_of: it?.month_of ?? null,
        })),
      },
    };


    if (requestFromId && !isNaN(Number(requestFromId))) {
      createData.requestFrom = { connect: { id: Number(requestFromId) } };
    }


    const created = await prisma.mainRequest.create({
      data: createData,
      include: { proposedBudget: true, approval: true },
    });

    const referenceCode = formatRefId(created.id, "REF", 6);
   
    const updateRefCOde = await prisma.mainRequest.update({
      where: { id: created.id },
      data: { referenceCode: referenceCode },
    });


    const io = req.app.get("io");
    const nextApproverId = findNextApprover(reqType, created.approval[0]); 

    if (nextApproverId) {
      console.log(`🔔 Emitting new_request to user_${nextApproverId}`);
      io.to(`user_${nextApproverId}`).emit("new_request", {
        receiverId: nextApproverId,
        requestId: created.id,
        content: 'proposed',
      });
      console.log(`sending to user_${nextApproverId}`);
    } else {
      console.log("no sender");
    }


    res.status(201).json({ message: "successfully added", created });
  } catch (err) {
    console.error("saveProposeBudgetForm error:", err);
    res.status(500).json({ message: "error occurred" });
  }

};




















export const saveTransmittalMemo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = toNum(req.user?.id);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { toId, from, date,description,items,note,requestTypeId,requestFromId } = req.body ?? {};

    if (!requestTypeId) {
      return res.status(400).json({ message: "Missing requestTypeId" });
    }

    const branch = await prisma.branch.findUnique({
      where: { id: Number(from) },
      select: { branchName: true },
    });

    const reqType = await prisma.requestType.findUnique({
      where: { id: Number(requestTypeId) },
      select: {
        notedBy: { select: { id: true } },
        checkedBy: { select: { id: true } },
        checkedBy2: { select: { id: true } },
        recomApproval: { select: { id: true } },
        recomApproval2: { select: { id: true } },
        approveBy: { select: { id: true } },
      },
    });

    if (!reqType) {
      return res.status(404).json({ message: "RequestType not found" });
    }


    const createData: any = {
      requestDate: date ? new Date(date) : new Date(),
      requestType: { connect: { id: Number(requestTypeId) } },
      requestBy: { connect: { id: userId } },
      remarks: "transmittal_memo",
      referenceCode:"temp",
      transmittalMemo: {
        create: {
          to_id: toId,
          from: branch?.branchName ?? "",
          date: date ? new Date(date) : new Date(),
          description: description || null,
          note: note || null,
          items: Array.isArray(items) ? items : [],
        },
      },
      approval: {
        create: {
          notedBy: reqType.notedBy?.id ? "PENDING" : "EMPTY",
          checkedBy: reqType.checkedBy?.id ? "PENDING" : "EMPTY",
          checkedBy2: reqType.checkedBy2?.id ? "PENDING" : "EMPTY",
          recomApproval: reqType.recomApproval?.id ? "PENDING" : "EMPTY",
          recomApproval2: reqType.recomApproval2?.id ? "PENDING" : "EMPTY",
          approveBy: reqType.approveBy?.id ? "PENDING" : "EMPTY",
        },
      },
    };

    if (requestFromId && !isNaN(Number(requestFromId))) {
      createData.requestFrom = { connect: { id: Number(requestFromId) } };
    }

    const created = await prisma.mainRequest.create({
      data: createData,
      include: { transmittalMemo: true, approval: true },
    });

    const referenceCode = formatRefId(created.id, "REF", 6);
   
    const updateRefCOde = await prisma.mainRequest.update({
      where: { id: created.id },
      data: { referenceCode: referenceCode },
    });


    const io = req.app.get("io");
    const nextApproverId = findNextApprover(reqType, created.approval[0]); 

    if (nextApproverId) {
      console.log(`🔔 Emitting new_request to user_${nextApproverId}`);
      io.to(`user_${nextApproverId}`).emit("new_request", {
        receiverId: nextApproverId,
        requestId: created.id,
        content: created.transmittalMemo?.to_id,
      });
      console.log(`sending to user_${nextApproverId}`);
    } else {
      console.log("no sender");
    }


    res.status(201).json({ message: "successfully added", created });
  } catch (error) {
    console.error("saveTravelOrderForm error:", error);
    res.status(500).json({ message: "error occurred" });
  }
};

























export const saveDisburse = async (req: AuthRequest, res: Response) => {
  try {
    const userId = toNum(req.user?.id);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { toId, fromName,subject,date,description,note,total_amount,requestTypeId,requestFromId,items } = req.body ?? {};

    if (!requestTypeId) {
      return res.status(400).json({ message: "Missing requestTypeId" });
    }


    const reqType = await prisma.requestType.findUnique({
      where: { id: Number(requestTypeId) },
      select: {
        notedBy: { select: { id: true } },
        checkedBy: { select: { id: true } },
        checkedBy2: { select: { id: true } },
        recomApproval: { select: { id: true } },
        recomApproval2: { select: { id: true } },
        approveBy: { select: { id: true } },
      },
    });

    if (!reqType) {
      return res.status(404).json({ message: "RequestType not found" });
    }


    const createData: any = {
      requestDate: date ? new Date(date) : new Date(),
      requestType: { connect: { id: Number(requestTypeId) } },
      requestBy: { connect: { id: userId } },
      remarks: "disburse",
      referenceCode:"temp",
      disburse: {
        create: {
          to_id: toId,
          from: fromName,
          subject:subject,
          date: date ? new Date(date) : new Date(),
          description: description || null,
          note: note || null,
          total_amount:total_amount || null,
          items: items ?? [],
        },
      },
      approval: {
        create: {
          notedBy: reqType.notedBy?.id ? "PENDING" : "EMPTY",
          checkedBy: reqType.checkedBy?.id ? "PENDING" : "EMPTY",
          checkedBy2: reqType.checkedBy2?.id ? "PENDING" : "EMPTY",
          recomApproval: reqType.recomApproval?.id ? "PENDING" : "EMPTY",
          recomApproval2: reqType.recomApproval2?.id ? "PENDING" : "EMPTY",
          approveBy: reqType.approveBy?.id ? "PENDING" : "EMPTY",
        },
      },
    };



    if (requestFromId && !isNaN(Number(requestFromId))) {
      createData.requestFrom = { connect: { id: Number(requestFromId) } };
    }

    const created = await prisma.mainRequest.create({
      data: createData,
      include: { disburse: true, approval: true },
    });

    const referenceCode = formatRefId(created.id, "REF", 6);
   
    await prisma.mainRequest.update({
      where: { id: created.id },
      data: { referenceCode: referenceCode },
    });


    const io = req.app.get("io");
    const nextApproverId = findNextApprover(reqType, created.approval[0]); 

    if (nextApproverId) {
      console.log(`🔔 Emitting new_request to user_${nextApproverId}`);
      io.to(`user_${nextApproverId}`).emit("new_request", {
        receiverId: nextApproverId,
        requestId: created.id,
        content: created.disburse?.to_id,
      });
      console.log(`sending to user_${nextApproverId}`);
    } else {
      console.log("no sender");
    }


    res.status(201).json({ message: "successfully added", created });
  } catch (error) {
    console.error("saveTravelOrderForm error:", error);
    res.status(500).json({ message: "error occurred" });
  }

};