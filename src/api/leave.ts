import { api } from "./client";
import { CalculateDaysRequest, CalculateDaysResponse, CreateLeaveRequest, LeaveApplication, LeaveBalance } from "@/types/leave";

export const calculateWorkingDays = async (data: CalculateDaysRequest): Promise<CalculateDaysResponse> => {
    const response = await api.post("/leave/calculate-days", data);
    return response.data;
};

export const applyForLeave = async (data: CreateLeaveRequest): Promise<LeaveApplication> => {
    const response = await api.post("/leave/apply", data);
    return response.data;
};

export const getMyApplications = async (): Promise<LeaveApplication[]> => {
    // const response = await api.get("/leave/my-applications");
    // return response.data;
    
    // Mocking data for now as per plan
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                    id: "1",
                    applicationNumber: "LV/2023/0010",
                    leaveType: "Sick",
                    startDate: "2023-08-01",
                    endDate: "2023-08-03",
                    days: 3,
                    status: "approved",
                    reason: "Flu",
                    createdAt: "2023-07-28T10:00:00Z"
                },
                {
                    id: "2",
                    applicationNumber: "LV/2023/0042",
                    leaveType: "Annual",
                    startDate: "2023-11-01",
                    endDate: "2023-11-05",
                    days: 5,
                    status: "pending",
                    reason: "Personal vacation",
                    createdAt: "2023-10-25T14:30:00Z"
                }
            ]);
        }, 500);
    });
};

export const getMyLeaveBalances = async (): Promise<LeaveBalance[]> => {
    // const response = await api.get("/leave/balances");
    // return response.data;

    // Mocking data for now
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { leaveType: "Annual", entitled: 20, taken: 5, remaining: 15 },
                { leaveType: "Sick", entitled: 10, taken: 0, remaining: 10 },
                { leaveType: "Compassionate", entitled: 5, taken: 0, remaining: 5 }
            ]);
        }, 500);
    });
};

// Manager APIs
export const getPendingApprovals = async (): Promise<LeaveApplication[]> => {
     // Mocking data for now
     return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                   id: "3",
                    applicationNumber: "LV/2023/0055",
                    leaveType: "Annual",
                    startDate: "2023-12-20",
                    endDate: "2023-12-30",
                    days: 10,
                    status: "pending",
                    reason: "Christmas Break",
                    staffName: "John Doe",
                    staffId: "user-123",
                    createdAt: "2023-11-01T09:00:00Z"
                }
            ]);
        }, 500);
    });
};

export const processApproval = async (id: string, status: "approved" | "rejected", comments?: string) => {
    // const response = await api.post(`/leave/${id}/${status}`, { comments });
    // return response.data;
     return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true });
        }, 500);
    });
};
