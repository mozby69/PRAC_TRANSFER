import { Request, Response } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import { formatRefId } from "../utils/idConverter";

const prisma = new PrismaClient();

const toNum = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};


export const createFund = async (req: AuthRequest, res: Response) => {
  try {

    const userId = toNum(req.user?.id);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { fundType, travelRows, cashRows, requestTypeId, branchId,dateCounted, ...data } = req.body;

    if (!fundType || !branchId || !requestTypeId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Step 1: request type definition
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

    if (fundType === "Travel") {
      const created = await prisma.mainRequest.create({
        data: {
          requestDate: dateCounted ? new Date(dateCounted) : new Date(),
          requestType: { connect: { id: Number(requestTypeId) } },
          requestFrom: { connect: { id: Number(branchId) } },
          requestBy: { connect: { id: userId } },
          referenceCode: "TEMP",

          countSheet: {
              create: 
                {
                  fundType: "Travel",
                  office: data.office ?? "HQ",
                  dateCount: dateCounted ? new Date(dateCounted) : new Date(),
                  fundName: data.fundName ?? "Travel Fund",
                  fundAmount: new Prisma.Decimal(data.fundAmount ?? 0),
                  reference: data.reference,
                  cashDemo: data.cashDemo ?? null,
                  repFund: new Prisma.Decimal(data.repFund ?? 0),
                  totalFund: new Prisma.Decimal(data.totalFund ?? 0),
                  cashShort: new Prisma.Decimal(data.cashShort ?? 0),

                  TravelCountSheet: {
                    create: (travelRows ?? []).map((row: any) => ({
                      tagsField: row.tagsField ?? [],
                      startDate: row.startDate ? new Date(row.startDate) : new Date(),
                      endDate: row.endDate ? new Date(row.endDate) : new Date(),
                      reqDate: row.travelDate ? new Date(row.travelDate) : new Date(),
                      travelling: row.travelling,
                      fuel: row.fuelFee ?? null,
                      repair: row.repairs ?? [],
                      litigation: row.litigationExp ?? null,
                      totalFee: row.totalFunds ?? 0,
                      kilometer: row.travelKm,
                      remarks: row.fundRemarks,
                    })),
                  },
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
        },
        include: {
          countSheet: {
            include: { TravelCountSheet: true },
          },
          approval: true,
        },
      });

      return res.status(201).json(created);
    }

    if (fundType === "Cash") {
       const created = await prisma.mainRequest.create({
        data: {
          requestDate: dateCounted ? new Date(dateCounted) : new Date(),
          requestType: { connect: { id: Number(requestTypeId) } },
          requestFrom: { connect: { id: Number(branchId) } },
          requestBy: { connect: { id: userId } },
          referenceCode: "Temp",

          countSheet: {
              create: 
                {  
                  fundType: "Cash",
                  office: data.office ?? "HQ",
                  dateCount: dateCounted ? new Date(dateCounted) : new Date(),
                  fundName: data.fundName ?? "Cash Fund",
                  fundAmount: new Prisma.Decimal(data.fundAmount ?? 0),
                  reference: data.reference,
                  cashDemo: data.cashDemo ?? null,
                  repFund: new Prisma.Decimal(data.repFund ?? 0),
                  totalFund: new Prisma.Decimal(data.totalFund ?? 0),
                  cashShort: new Prisma.Decimal(data.cashShort ?? 0),


                  CashCountSheet: {
                    create: (cashRows ?? []).map((row: any) => ({
                      startDate: row.startDate ? new Date(row.startDate) : new Date(),
                      endDate: row.endDate ? new Date(row.endDate) : new Date(),
                      reqDate: row.funDate ? new Date(row.funDate) : new Date(),
                      payee: row.payee,
                      remarks: row.fundRemarks,
                      fundAmount: row.fundAmount ?? 0,
                      miscExp: row.miscExp ?? null,
                      billFee: row.powerLight ?? null,
                      telFee: row.telephone ?? null,   
                      dueMh: row.dueToMh ?? null,
                    })),
                  },
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
        },
        include: {
          countSheet: {
            include: { CashCountSheet: true },
          },
          approval: true,
        },
      });

      
          const referenceCode = formatRefId(created.id, "REF", 6);
         
          const updateRefCOde = await prisma.mainRequest.update({
            where: { id: created.id },
            data: { referenceCode: referenceCode },
          });
      

      return res.status(201).json(created);
    }

    return res.status(400).json({ message: "Invalid fundType" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error creating fund", error });
  }
};