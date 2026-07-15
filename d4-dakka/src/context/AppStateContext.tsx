import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ServiceType } from '../navigation/types';

export type VehicleType = 'Motorcycle/Bike' | 'Car/Auto';
export type PaymentMethod = 'Cash on Delivery' | 'Digital Wallet';

export interface ActiveRequest {
  serviceType: ServiceType;
  vehicleType: VehicleType;
  address: string;
  estimate: number; // USD quick estimate shown on request screen
}

export interface Receipt {
  serviceType: ServiceType;
  vehicleType: VehicleType;
  baseFare: number;
  distanceFee: number;
  total: number;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  serviceType: ServiceType;
  date: string;
  amount: number;
  status: 'Completed';
}

export interface Helper {
  name: string;
  rating: number;
  vehicleNumber: string;
  phone: string;
  avatarInitials: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  vehicleType: VehicleType;
  vehiclePlate: string;
}

interface AppStateValue {
  activeRequest: ActiveRequest | null;
  setActiveRequest: (request: ActiveRequest) => void;
  clearActiveRequest: () => void;

  receipt: Receipt | null;
  generateReceipt: () => void;
  completePayment: (method: PaymentMethod) => void;

  serviceHistory: HistoryEntry[];

  helper: Helper;
  user: UserProfile;
}

const HELPER: Helper = {
  name: 'Kamran Khan',
  rating: 4.9,
  vehicleNumber: 'LEZ-4520',
  phone: '+923007654321',
  avatarInitials: 'KK',
};

const DEFAULT_USER: UserProfile = {
  name: 'Abdullah Raza',
  phone: '+923219876543',
  vehicleType: 'Car/Auto',
  vehiclePlate: 'LEA-7781',
};

const INITIAL_HISTORY: HistoryEntry[] = [
  { id: 'h1', serviceType: 'Puncture', date: '2026-07-02', amount: 900, status: 'Completed' },
  { id: 'h2', serviceType: 'Towing/Dakka', date: '2026-06-21', amount: 2100, status: 'Completed' },
  { id: 'h3', serviceType: 'Petrol', date: '2026-06-10', amount: 700, status: 'Completed' },
];

const AppStateContext = createContext<AppStateValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [activeRequest, setActiveRequestState] = useState<ActiveRequest | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [serviceHistory, setServiceHistory] = useState<HistoryEntry[]>(INITIAL_HISTORY);

  const setActiveRequest = useCallback((request: ActiveRequest) => {
    setActiveRequestState(request);
  }, []);

  const clearActiveRequest = useCallback(() => {
    setActiveRequestState(null);
  }, []);

  const generateReceipt = useCallback(() => {
    setActiveRequestState((current) => {
      if (!current) return current;
      const baseFare = current.vehicleType === 'Car/Auto' ? 1200 : 800;
      const distanceFee = Math.round(200 + Math.random() * 300);
      setReceipt({
        serviceType: current.serviceType,
        vehicleType: current.vehicleType,
        baseFare,
        distanceFee,
        total: baseFare + distanceFee,
        createdAt: new Date().toISOString(),
      });
      return current;
    });
  }, []);

  const completePayment = useCallback((_method: PaymentMethod) => {
    setReceipt((currentReceipt) => {
      if (currentReceipt) {
        setServiceHistory((prev) => [
          {
            id: `h${Date.now()}`,
            serviceType: currentReceipt.serviceType,
            date: new Date().toISOString().slice(0, 10),
            amount: currentReceipt.total,
            status: 'Completed',
          },
          ...prev,
        ]);
      }
      return null;
    });
    setActiveRequestState(null);
  }, []);

  const value = useMemo<AppStateValue>(
    () => ({
      activeRequest,
      setActiveRequest,
      clearActiveRequest,
      receipt,
      generateReceipt,
      completePayment,
      serviceHistory,
      helper: HELPER,
      user: DEFAULT_USER,
    }),
    [activeRequest, receipt, serviceHistory, setActiveRequest, clearActiveRequest, generateReceipt, completePayment]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return ctx;
}
