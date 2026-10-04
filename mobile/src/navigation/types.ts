export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  OrderDetail: { orderId: string };
  OrderForm: { orderId?: string } | undefined;
  ProfileInfo: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
  Security: undefined;
};

export type TabParamList = {
  Orders: undefined;
  Customers: undefined;
  Profile: undefined;
};
