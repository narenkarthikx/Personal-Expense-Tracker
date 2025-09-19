"use client"

import React, { createContext, useContext, ReactNode } from "react"

// Define the shape of our config context
type ConfigContextType = {
  disableStaticRendering: boolean
}

// Create the context with default values
const ConfigContext = createContext<ConfigContextType>({
  disableStaticRendering: false
})

// Provider component
export function ConfigProvider({
  children,
  disableStaticRendering = false
}: {
  children: ReactNode
  disableStaticRendering?: boolean
}) {
  return (
    <ConfigContext.Provider value={{ disableStaticRendering }}>
      {children}
    </ConfigContext.Provider>
  )
}

// Hook for using the config
export function useConfig() {
  return useContext(ConfigContext)
}
