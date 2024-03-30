import { createContext, useState } from 'react'

export const StateContext = createContext()

const GlobalStateProvider = ({ children }) => {
  const [ globalState, setGlobalState ] = useState({
    lang: 'ru'
  })

  return (
    <StateContext.Provider value={{ globalState, setGlobalState }}>
      {children}
    </StateContext.Provider>
  )
}

export default GlobalStateProvider