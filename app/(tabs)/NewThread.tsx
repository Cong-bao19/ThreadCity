import React from "react";
import NewThreadScreen from "@/screens/NewThreadScreen";

export default function NewThread() {
  return <NewThreadScreen onClose={() => console.log("Closed New Thread")} />;
}
