// Mock Flow Type Definition
declare global {
  namespace NodeJS {
    interface Global {
      Flow: {
        setNonOptionalType: (value: any) => void;
        setOptionalType: (value: any) => void;
        setMaybeOptionalType: (value: any) => void;
      };
    }
  }
}
export { };

