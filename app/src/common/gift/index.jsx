import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import { ReplaceAddress } from '../../config'
import { FormattedMessage } from 'react-intl'
import { actionCreatorsHeader } from '../header/store'
import { Modal } from 'antd';
import './index.less'

const setUpAccountTransactionSource = `\
import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
import FanNFT from "../../contracts/FanNFT.cdc"
pub fun hasGifts(_ address: Address): Bool {
  return getAccount(address)
    .getCapability<&FanNFT.Collection{NonFungibleToken.CollectionPublic, FanNFT.GiftCollectionPublic}>(FanNFT.GiftPublicPath)
    .check()
}
transaction {
  prepare(signer: AuthAccount) {
    if !hasGifts(signer.address){
      log("account init start")
      if signer.borrow<&FanNFT.Collection>(from: FanNFT.GiftStoragePath) == nil {
        signer.save(<-FanNFT.createEmptyCollection(), to: FanNFT.GiftStoragePath)
      }
      signer.unlink(FanNFT.GiftPublicPath)
      signer.link<&{NonFungibleToken.CollectionPublic,FanNFT.GiftCollectionPublic}>
        (FanNFT.GiftPublicPath,target: FanNFT.GiftStoragePath)
    }else{
      log("account init already")
    }
  }
}
`

const getGiftsScriptSource = `
import FanNFT from "../../contracts/FanNFT.cdc"
import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"

// 用于获取账户下的giftID

pub fun main(address: Address): [UInt64] {
    let account = getAccount(address)
    let collectionRef = account.getCapability(FanNFT.GiftPublicPath)
      .borrow<&{FanNFT.GiftCollectionPublic}>()
      ?? panic("Could not borrow capability from public collection")
    return collectionRef.getIDs()
}
`

const getGiftInfoScriptSource = `
import FanNFT from "../../contracts/FanNFT.cdc"
import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"
// 返回用户持有的giftNFT信息
pub fun main(address: Address, giftIDs: [UInt64]): [FanNFT.GiftData] {
    let collectionRef = getAccount(address).getCapability(FanNFT.GiftPublicPath)
      .borrow<&{FanNFT.GiftCollectionPublic}>()
      ?? panic("Could not borrow capability from public collection")
    let giftsData:[FanNFT.GiftData] = []
    for giftID in giftIDs{
      let giftItem = collectionRef.borrowGift(id: giftID)
          ?? panic("No such giftID in that collection")
      giftsData.append(giftItem.data)
    }
    return giftsData
}
`

const getGiftsScript = ReplaceAddress(getGiftsScriptSource)
const getGiftInfoScriptScript = ReplaceAddress(getGiftInfoScriptSource)
const getAuth = ReplaceAddress(setUpAccountTransactionSource)

class Gift extends PureComponent {

  componentDidMount() {
    const packageInfoList = this.props.packageInfoList.toJS()
    const {
      userAddress
    } = this.props
    this.props.handleGiftDataInfo(getGiftsScript, getGiftInfoScriptScript, userAddress, packageInfoList)
  }

  render() {
    const {
      isModalVisible,
      handleOk,
      handleCancel
    } = this.props
    return (
      <div className="giftBox">
        <div className="title">
          <FormattedMessage
            id='MyGift'
            defaultMessage="MyGift"
          />
        </div>
        <Modal title="confirm" visible={isModalVisible} onOk={() => handleOk(getAuth)} onCancel={() => handleCancel()}>
          <p>需要重新确认用户认证</p>
        </Modal>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  connectWallet: state.getIn(['header', 'connectWallet']),
  userAddress: state.getIn(['header', 'userAddress']),
  packageInfoList: state.getIn(['header', 'packageInfoList']),
  isModalVisible: state.getIn(['header', 'isModalVisible']),
});

const mapDispatchToProps = (dispatch) => {
  return {
    handleGiftDataInfo(getGiftsScript, getGiftInfoScriptScript, userAddress) {
      dispatch(actionCreatorsHeader.giftDataInfo(getGiftsScript, getGiftInfoScriptScript, userAddress))
    },
    handleOk(getAuth) {
      dispatch(actionCreatorsHeader.toggleAuth(getAuth))
    },
    handleCancel() {
      dispatch(actionCreatorsHeader.toggleHandleCancel())
    },
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Gift);