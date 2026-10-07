type SnapResult = {
  order_id?: string;
  transaction_status?: string;
  status_message?: string;
  [key: string]: unknown;
};

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks?: {
          onSuccess?: (result: SnapResult) => void;
          onPending?: (result: SnapResult) => void;
          onError?: (result: SnapResult) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

export {};
