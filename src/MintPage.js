import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import contractabi from './contracts/artifacts/contractabi.json'
import PropTypes from 'prop-types'
import LinearProgress from '@mui/material/LinearProgress'
import Box from '@mui/material/Box'
import { initWeb3Onboard } from './services'
import Lottie from 'react-lottie-player'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  useConnectWallet,
  useNotifications,
  useSetChain,
  useWallets
} from '@web3-onboard/react'
import './App.css'
import lottie from './coin.json'

const NFTAddress = '0x40787bD1dd0097fA118D0D6C060Df5bAc1Ebb468'
function LinearProgressWithLabel(props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress
          sx={{ height: '15px', borderRadius: '30px', background: '#0073ff3b' }}
          variant="determinate"
          {...props}
        />
      </Box>
    </Box>
  )
}
LinearProgressWithLabel.propTypes = {
  /**
   * The value of the progress indicator for the determinate and buffer variants.
   * Value between 0 and 100.
   */
  value: PropTypes.number.isRequired
}

function MintPage() {
  const [{ wallet }, connect, disconnect] = useConnectWallet()
  const [notifications] = useNotifications()
  const connectedWallets = useWallets()
  const [web3Onboard, setWeb3Onboard] = useState(null)
  const [{ connectedChain }, setChain] = useSetChain()
  // const [error, setError] = useState('')
  const [data, setData] = useState({})
  const [quantity, setQuantity] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setWeb3Onboard(initWeb3Onboard)
  }, [])

  useEffect(() => {
    console.log(notifications)
  }, [notifications])

  useEffect(() => {
    if (!connectedWallets.length) return

    const connectedWalletsLabelArray = connectedWallets.map(
      ({ label }) => label
    )
    window.localStorage.setItem(
      'connectedWallets',
      JSON.stringify(connectedWalletsLabelArray)
    )
  }, [connectedWallets, wallet])

  useEffect(() => {
    if (connectedWallets.length !== 0) {
      fetchData()
    }
    // eslint-disable-next-line
  }, [connectedWallets])

  useEffect(() => {
    const previouslyConnectedWallets = JSON.parse(
      window.localStorage.getItem('connectedWallets')
    )

    if (previouslyConnectedWallets?.length) {
      async function setWalletFromLocalStorage() {
        await connect({
          autoSelect: previouslyConnectedWallets[0],
          disableModals: true
        })
      }
      setWalletFromLocalStorage()
    }
  }, [web3Onboard, connect])

  async function fetchData() {
    const provider = new ethers.providers.Web3Provider(
      connectedWallets[0].provider,
      'any'
    )
    const contract = new ethers.Contract(NFTAddress, contractabi.abi, provider)

    try {
      const price = await contract.mintPrice()
      const mintingDisabled = await contract.isMintingDisabled()
      const totalSupply = await contract.totalSupply()
      const maxSupply = await contract.maxSupply()
      const object = {
        price: price,
        mintingDisabled: String(mintingDisabled),
        totalSupply: totalSupply,
        maxSupply: maxSupply
      }
      setData(object)
      setLoading(false)
    } catch (err) {
      // setError(err.message)
      console.error(err.message)
      handleError(err)
    }
  }

  const handleConnect = async () => {
    connect()
      .then(console.log(connectedWallets))
      .catch(e => console.Console.log(e))
  }

  async function buy() {
    const provider = new ethers.providers.Web3Provider(
      connectedWallets[0].provider,
      'any'
    )
    const signer = provider.getSigner()
    const contract = new ethers.Contract(NFTAddress, contractabi.abi, signer)
    try {
      let overrides = {
        value: data.price.mul(quantity),
        from: connectedWallets[0]['accounts'][0]['address']
      }
      const transaction = await contract.mint(quantity, overrides)
      await transaction.wait()
      console.log(transaction)
      toast.success('You purchased the NFT successfully')
      fetchData()
    } catch (err) {
      // setError(err)
      handleError(err)
    }
  }

  async function handleError(err) {
    if (
      err.message?.includes('user rejected transaction') ||
      err.data?.message?.includes('user rejected transaction')
    ) {
      console.log('User denied the transaction signature.')
      toast.error('Transaction denied', {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark'
      })
    } else if (
      err.message?.includes('Insufficient') ||
      err.data?.message?.includes('Insufficient') ||
      err.message?.includes('ERC20: transfer amount exceeds balance') ||
      err.data?.message?.includes('ERC20: transfer amount exceeds balance')
    ) {
      console.log('Insufficient funds')
      toast.error('Insufficient funds', {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark'
      })
    } else {
      toast.error('Error occurs on your transaction', {
        position: 'bottom-center',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'dark'
      })
    }
  }

  const switchNetworkETH = async () => {
    await setChain({ chainId: '0xa4b1' })
  }
  useEffect(() => {
    function setScreenHeight() {
      document.documentElement.style.setProperty(
        '--screen-height',
        `${window.innerHeight}px`
      )
    }

    // Set the initial screen height
    setScreenHeight()

    // Update the screen height on resize
    window.addEventListener('resize', setScreenHeight)

    return () => {
      window.removeEventListener('resize', setScreenHeight)
    }
  }, [])

  return (
    <main>
      <section className="main">
        <div className="main-content">
          <div className="containerr onboard">
            <div className="part">
              {!wallet && (
                <>
                  <img src="logo.png" className="logo-before-connect" alt="" />
                  <button className="mintbutton" onClick={handleConnect}>
                    Connect Wallet
                  </button>
                </>
              )}
              {wallet && connectedChain.id === '0xa4b1' && loading && (
                <h2 className="loadingcolor">Loading...</h2>
              )}
              {wallet && connectedChain.id !== '0xa4b1' && (
                <div className="buttonswitch" onClick={switchNetworkETH}>
                  <h2>Switch to Arbitrum One Mainnet</h2>
                  <img src="/assets/eth.svg" className="buttonlogo" alt="" />
                </div>
              )}

              {!loading && wallet && connectedChain.id === '0xa4b1' && (
                <>
                  {data.phaseNumber === '0' && data.whitelisted === 'false' && (
                    <h2 className="whitelist">
                      You are not whitelisted. Please wait for the next phase.
                    </h2>
                  )}
                  {data.phaseNumber === '0' && data.whitelisted === 'true' && (
                    <h2 className="whitelist">You are whitelisted.</h2>
                  )}
                  <div className="minting">
                    <>
                      <h1 className="tokensowned">
                        We mint random NFT for you.
                      </h1>
                      <h2 className="wallet">Connected wallet</h2>
                      <h3 className="wallet-address">
                        {connectedWallets[0]['accounts'][0]['address']}
                      </h3>
                      <div className="cost">
                        <h2>1 NFT = {data.price.toString() / 10 ** 18} ETH</h2>
                      </div>
                    </>

                    <div>
                      <div className="quantitymint">
                        <h2>Quantity</h2>
                        <input
                          type="number"
                          id="quantity"
                          min={data.price.toString()}
                          max={data.price.toString()}
                          step="1"
                          value={quantity}
                          onChange={e => setQuantity(e.target.value)}
                        />
                      </div>

                      <div className="mintbuttons">
                        <button
                          className="mintbutton"
                          disabled={data.whitelisted === 'false'}
                          onClick={() => buy()}
                        >
                          BUY NFT
                        </button>
                        <button
                          className="mintbutton"
                          onClick={() => disconnect(wallet)}
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="line"></div>
            <div className="lottie part">
              <Lottie className="lottie" loop animationData={lottie} play />
              {!loading && wallet && connectedChain.id === '0xa4b1' && (
                <>
                  <div className="progress">
                    <h3 className="minted">
                      NFTs Sold: &nbsp;
                      {Number(data.totalSupply.toString()).toLocaleString(
                        'en-US'
                      )}{' '}
                      /{' '}
                      {Number(data.maxSupply.toString()).toLocaleString(
                        'en-US'
                      )}{' '}
                      (
                      {Math.round(
                        ((data.totalSupply.toString() * 100) /
                          data.maxSupply.toString()) *
                          100
                      ) /
                        100 +
                        '%'}
                      )
                    </h3>
                    <Box sx={{ width: '100%', height: '60px' }}>
                      <LinearProgressWithLabel
                        value={
                          (data.totalSupply.toString() * 100) /
                          data.maxSupply.toString()
                        }
                      />
                    </Box>
                  </div>
                </>
              )}
            </div>

            <ToastContainer
              position="bottom-center"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />
          </div>
        </div>
      </section>
    </main>
  )
}

export default MintPage
