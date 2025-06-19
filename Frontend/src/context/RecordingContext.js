import React, { createContext, useState } from "react";

export const RecordingContext = createContext();

export const RecordingProvider = ({ children }) => {
  const [audioUri, setAudioUri] = useState(null);
  const [metadata, setMetadata] = useState(null);

  return (
    <RecordingContext.Provider value={{ audioUri, setAudioUri, metadata, setMetadata }}>
      {children}
    </RecordingContext.Provider>
  );
};
