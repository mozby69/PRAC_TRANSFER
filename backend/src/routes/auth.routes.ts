import { Router } from 'express'
import { register, login, me, logout, listUsers } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth.middleware' // 👈 import middleware
import { addBranch, addRequestType, deleteBranch, fetchBranches, fetchListRequestTypes, updateBranch } from '../controllers/request.controller'
import { actOnRequest, addFundTransfer, getRequestsByUserStatus, getRequestsForApprover,saveTravelOrderForm,saveProposeBudgetForm, saveTransmittalMemo, saveDisburse } from '../controllers/form.controller'
import { upload } from '../middleware/upload.middleware'
import { createFund } from '../controllers/fund.controller'

const router = Router()
router.post('/register', upload.single('signature'), register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

//User Route
router.get('/users',authenticate, listUsers);

// Request Router 
// router.post('/request/add-checker', authenticate, addChecker)
// router.get('/request/fetch-checker', authenticate, fetchChecker)
// router.delete('/request/checker/:id', authenticate, deleteChecker);
// router.put("/request/checker/:id",authenticate,  updateChecker); 

//Branch Router
router.post('/request/add-branch',authenticate, addBranch)
router.get('/request/fetch-branch', authenticate, fetchBranches)
router.put("/request/update-branch/:id",authenticate,  updateBranch); 
router.delete("/request/delete-branch/:id",authenticate,  deleteBranch); 

//Request type
router.post('/request/add-request-type/', authenticate, addRequestType);
router.get('/request/list-request-type/', authenticate, fetchListRequestTypes)


//Form 
router.post('/request/add-fund-transfer/', authenticate, addFundTransfer);
router.get('/request/get-request-approver/', authenticate, getRequestsForApprover);
router.get('/request/get-request-action/', authenticate, getRequestsByUserStatus);
router.patch('/request/:id/action/', authenticate, actOnRequest);
router.post('/add-travel-form',authenticate,saveTravelOrderForm);
router.post('/add-proposed-budget',authenticate,saveProposeBudgetForm);
router.post('/add-transmittal-memo',authenticate,saveTransmittalMemo);
router.post('/add-disburse',authenticate,saveDisburse);



//CountSheet
router.post('/request/add-count-sheet', authenticate, createFund);


export default router
