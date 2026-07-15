export type ServiceType = 'Puncture' | 'Petrol' | 'Mechanic' | 'Towing/Dakka';

export type RootStackParamList = {
  Splash: undefined;
  HomeDashboard: undefined;
  ServiceRequestDetails: { serviceType: ServiceType };
  ActiveTracking: undefined;
  PaymentAndReceipt: undefined;
  EmergencyContacts: undefined;
  UserProfile: undefined;
};
