import { z } from "zod";

export const requestTypeSchema = z.object({
  requestName: z.string().min(1, "Request name is required"),
  notedById: z.number().optional(),
  checkedById: z.number().optional(),
  checkedBy2Id: z.number().optional(),
  recomApprovalId: z.number().optional(),
  recomApproval2Id: z.number().optional(),
  approveById: z.number().optional(),
})


const RoleEnum = z.enum(["Admin", "User", "Branch", "Superadmin", "Coordinator"]);


export const registerSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  username: z.string().min(1),
  password: z.string().min(6),
  role: RoleEnum.default("User"),
  branchId: z.coerce.number().optional(),
  approver: z.coerce.boolean().default(false),
  position: z.string().min(1),
  initial: z.string().min(1),

})
