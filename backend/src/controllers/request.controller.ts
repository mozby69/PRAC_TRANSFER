import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { requestTypeSchema } from "../lib/request.schema";

const prisma = new PrismaClient();

// export const addChecker = async (req: Request, res: Response) => {
//   const { userId, position, initial } = req.body;
//   try {
//     const existing = await prisma.requestChecker.findUnique({ where: { userId } });
//     if (existing) return res.status(400).json({ message: 'Name already exists' });

//     const checker = await prisma.requestChecker.create({
//       data: { userId, position, initial },
//     });
    
//     const io = req.app.get("io"); // Get Socket.IO instance from Express
//     io.emit("notification", {
//       message: `✅ Checker "${checker.userId}" added successfully!`,
//     });

//     return res.status(201).json({
//       message: 'Checker created',
//       checker: {
//         name: checker.userId,
//         position: checker.position,
//         initial: checker.initial
//       }
//     });
//   } catch (err) {
//     console.error("Error adding checker:", err);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

// export const fetchChecker = async(req: Request, res: Response) =>{
//     try {
//         const checker = await prisma.requestChecker.findMany({
//           include: {
//             checkerName: { select: { name: true } },
//           }
//         });
//         res.status(200).json(checker);
//     }catch (error){
//         console.error("Error fetching branches:", error);
//         res.status(500).json({message: "Internal server error"});
//     }
// }

// export const deleteChecker = async (req: Request, res: Response) => {
//   try {
//     const id = Number(req.params.id);
//     if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

//     const io = req.app.get("io"); // ✅ Good: get io instance from app

//     const deleted = await prisma.requestChecker.delete({
//       where: { id },
//     });

//     io.emit("notification", {
//       message: `✅ Deleted "${id}" added successfully!`,
//     });


//     return res.status(200).json({
//       message: 'Deleted successfully',
//       data: deleted,
//     });
//   } catch (error) {
//     console.error('Delete error:', error);
//     return res.status(500).json({ error: 'Server error' });
//   }
// };



// export const updateChecker = async (req: Request, res: Response) => {
//   try {
//     const id = Number(req.params.id);
//     const { userId, position, initial } = req.body;

//     if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

//     const io = req.app.get('io'); // 🔁 Get Socket.IO instance

//     const updated = await prisma.requestChecker.update({
//       where: { id },
//       data: { userId, position, initial },
//     });

//     // 🔁 Notify all clients that the checker was updated
//     io.emit("notification", {
//       message: `✅ Update "${id}"  successfully!`,
//     });

//     return res.status(200).json({ message: 'Checker updated', data: updated });
//   } catch (error) {
//     console.error('Update error:', error);
//     return res.status(500).json({ error: 'Server error' });
//   }
// };



// Branches 

export const addBranch = async (req: Request, res: Response) => {
  const  { branchCode, branchName, bom, faa, telephone, address, companyName} = req.body;
  try {
    const existing = await prisma.branch.findUnique({ where: { branchCode } });
    if (existing) return res.status(400).json({ message: 'Name already exists' });

    const branches = await prisma.branch.create({
      data: { branchCode, branchName, bom, faa, telephone, address, companyName},
    });
    
    const io = req.app.get("io"); // Get Socket.IO instance from Express
    io.emit("notification", {
      message: `✅ Branch "${branches.branchCode}" added successfully!`,
    });

    return res.status(201).json({
      message: 'Branch created',
      checker: {
        branchCode: branches.branchCode,
       
      }
    });
  } catch (err) {
    console.error("Error adding checker:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const fetchBranches = async(req: Request, res: Response) =>{
  try {
      const branch = await prisma.branch.findMany({
      });
      res.status(200).json(branch);
  }catch (error){
      console.error("Error fetching branches:", error);
      res.status(500).json({message: "Internal server error"});
  }
}




export const updateBranch = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { branchCode, branchName, bom, faa } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const io = req.app.get('io'); // 🔁 Get Socket.IO instance

    const updated = await prisma.branch.update({
      where: { id },
      data: { branchCode, branchName, bom, faa },
    });

    // 🔁 Notify all clients that the checker was updated
    io.emit("notification", {
      message: `✅ Update "${id}"  successfully!`,
    });

    return res.status(200).json({ message: 'Branch updated', data: updated });
  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};



export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const io = req.app.get("io"); // ✅ Good: get io instance from app
    const deleted = await prisma.branch.delete({
      where: { id },
    });
    io.emit("notification", {
      message: `✅ Deleted "${id}" added successfully!`,
    });
    return res.status(200).json({
      message: 'Deleted successfully',
      data: deleted,
    });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Request type 

export const addRequestType = async (req: Request, res: Response) => {
  try {
    // 🔍 Validate request body
    const body = requestTypeSchema.parse(req.body);
    // 🔍 Check for duplicates
    const existing = await prisma.requestType.findUnique({
      where: { requestName: body.requestName },
    });
    if (existing) {
      return res.status(400).json({ message: "Request name already exists" });
    }

    const requestType = await prisma.requestType.create({
      data: body,
    });

    const io = req.app.get("io"); 
    io.emit("notification", {
      message: `✅ Request Type "${requestType.requestName}" added successfully!`,
    });

    return res.status(201).json({
      message: "Request Type created",
      request: requestType,
    });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed1",
        errors: err.errors,
      });
    }
    console.error("Error adding request type:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const getRequestTypeById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const type = await prisma.requestType.findUnique({
      where: { id },
      include: {
        notedBy: true,
        checkedBy: true,
        checkedBy2: true,
        recomApproval: true,
        recomApproval2: true,
        approveBy: true,
      },
    });
    if (!type) return res.status(404).json({ message: "Not found" });
    return res.json({ data: type });
  } catch (e) {
    console.error("getRequestTypeById error:", e);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const fetchListRequestTypes = async (_req: Request, res: Response) => {
  try {
    const types = await prisma.requestType.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        notedBy: { select: { id: true, name: true, initial: true, position: true } },       // 👈 join to user
        checkedBy: { select: { id: true,  name: true, initial: true, position: true} },
        checkedBy2: { select: { id: true, name: true, initial: true, position: true } },
        recomApproval: { select: { id: true, name: true, initial: true, position: true } },
        recomApproval2: { select: { id: true, name: true, initial: true, position: true } },
        approveBy: { select: { id: true, name: true, initial: true, position: true } },
      },
    });
    return res.json({ data: types });
  } catch (e) {
    console.error("listRequestTypes error:", e);
    return res.status(500).json({ message: "Internal server error" });
  }
};
