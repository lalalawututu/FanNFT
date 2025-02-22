import React, { useState } from 'react'
import * as fcl from '@onflow/fcl'

import Card from '../components/Card'
import Header from '../components/Header'
import Code from '../components/Code'

const GetAccount = () => {
  const [data, setData] = useState(null)
  const [addr, setAddr] = useState('')

  const runGetAccount = async (event: any) => {
    event.preventDefault()
    if (!addr) {
      return
    }
    // const formatedAddr = addr.substr(2)
    const response = await fcl.send([fcl.getAccount(addr)])

    setData(await fcl.decode(response))
  }

  const updateAddr = (event: any) => {
    event.preventDefault()
    const addr = event.target.value

    setAddr(addr)
  }

  return (
    <Card>
      <Header>get account</Header>

      <input placeholder="Enter Flow address" onChange={updateAddr} />
      <button onClick={runGetAccount}>Lookup Account</button>

      {data && <Code>{JSON.stringify(data, null, 2)}</Code>}
    </Card>
  )
}

export default GetAccount
