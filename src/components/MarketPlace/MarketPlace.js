import React, { Component } from "react";
import Web3 from "web3";
import TroveI from "../../abis/NFT.json";
import TroveIt from "../../abis/Marketplace.json";
import Photography from "../../abis/Photography.json";
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MonetizationOnIcon from '@material-ui/icons/MonetizationOn';
import { red } from '@material-ui/core/colors';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Row, Col, Container} from 'react-bootstrap';
import styles from './Market.module.css'
import { StylesProvider } from "@material-ui/core";


const style = {
    content: {
        height: "100%",
        width: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        color: "white",
        padding: 7,
        borderRadius: 20,
    },
    root: {
        maxWidth: 345,
    },
    media: {
        height: 0,
        marginLeft: '20%',
        paddingTop: '56.25%', // 16:9
    },
    avatar: {
        backgroundColor: red[500],
    },
    floatContainer: {
        border: '3px solid #fff',
        padding: '20px',
        display: 'flex'
    },

    floatChild: {
        width: '50%',
        float: 'left',
        padding: '20px',
        border: '2px solid red'
    }
};

class MarketPlace extends Component {
    async componentWillMount() {
        await this.loadWeb3();
        await this.loadBlockchainData();
    }

    async loadWeb3() {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            await window.ethereum.enable();
        } else if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider);
        } else {
            window.alert(
                "Non-Ethereum browser detected. You should consider trying MetaMask!"
            );
        }
    }


    async loadBlockchainData() {

        const web3 = window.web3;

        // Initialize your dapp here like getting user accounts etc
        // Load account
        const accounts = await web3.eth.getAccounts();
        this.setState({ account: accounts[0] });
        navigator.geolocation.getCurrentPosition(
            position => this.setState({
                cr_latitude: position.coords.latitude,
                cr_longitude: position.coords.longitude
            }),
            err => console.log(err)
        );
        // Network ID
        const networkId = await web3.eth.net.getId();
        const networkData = TroveIt.networks[networkId];
        const net = TroveI.networks[networkId];
        const networkDataP = Photography.networks[networkId];

        if (networkData && net && networkDataP) {

            this.setState({ contractAddress: net.address });
            console.log(this.state.contractAddress,net.address)

            const troveit = new web3.eth.Contract(TroveIt.abi, networkData.address);
            this.setState({ troveit });
            const trovei = new web3.eth.Contract(TroveI.abi, net.address);
            this.setState({ trovei });
            const photography = new web3.eth.Contract(Photography.abi, networkDataP.address);
            this.setState({photography});

            const PostCount = await photography.methods.marketPlaceCounter().call();
            console.log(PostCount)
            this.setState({ PostCount: PostCount })
            for (var i = 0; i < PostCount; i++) {
                const assetID = await photography.methods.marketPlaceNFT(i).call()
                console.log(assetID)
                const tokenOwner = await trovei.methods.ownerOf(assetID).call()
                console.log(tokenOwner)
                const feedPost = await trovei.methods.tokenURI(assetID).call()
                console.log(feedPost)
                const slicedUrl = `https://ipfs.io/ipfs/${feedPost.slice(7, feedPost.length)}`
                console.log(slicedUrl)
                const response = await fetch(slicedUrl);
                console.log(response)
                const json = await response.json();
                const latitude = json.properties.latitude
                const longitude = json.properties.longitude

                const imageUrl = json.image.slice(7, json.image.length - 10)
                console.log(imageUrl)
                const finalUrl = `https://${imageUrl}.ipfs.dweb.link/trial.jpg`
                console.log(finalUrl)

                const Post = [assetID, json.name, json.description, finalUrl, latitude, longitude, tokenOwner]
                console.log(Post, this.state.feedPosts)

                this.setState({
                    feedPosts: [...this.state.feedPosts, [Post]],
                });
                console.log(Post, this.state.feedPosts)
            }

            this.setState({ loading: false });


        } else {
            window.alert("NFT contract not deployed to detected network.");
        }

    }

    buyPhoto = (assetID, prize) =>{
        this.setState({ loading: true })
        console.log(assetID, prize,'buyPhoto',this.state.contractAddress)
        let tipAmount = window.web3.utils.toWei('1', 'Ether')
        this.state.photography.methods
          .buyPhoto(this.state.contractAddress, assetID, tipAmount)
          .send({ from: this.state.account ,value: 1000000000000000000})
          .on("transactionHash", (hash) => {
            console.log(hash)
            this.setState({ loading: false });
          });
    }

    constructor(props) {
        super(props);
        this.state = {
            account: "",
            troveit: null,
            trovei: null,
            photography:null,
            PostCount: 0,
            contractAddress:null,
            feedPosts: [],
            loading: true,
            cr_latitude: '',
            cr_longitude: ''
        };

        this.buyPhoto=this.buyPhoto.bind(this);

    }

    render() {
        return (
            <div
                style={{ width: "100%", height: "100%", backgroundRepeat: "inherit" }}
            >
                {this.state.loading ? (
                    <div className="center mt-19" style={{ display: 'flex', justifyContent: 'center' }}>
                        {/* loader */}
                        <img src='https://media.giphy.com/media/XeA5bZwGCQCxgKqKtL/giphy.gif' ></img>
                        <br></br>
                    </div>
                ) : (
                    <div>
                        <div className="about">
                            <div className="container">
                                {/* <h1>{this.state.cr_latitude}</h1> */}
                                <br></br>
                                <div
                                    class="col-lg-12 ml-auto mr-auto"
                                    style={{ maxWidth: "780px" }}
                                >
                                    {console.log(this.state.cr_latitude, this.state.cr_longitude)}
                                    {this.state.feedPosts.map((feedPost) => {
                                       if ((this.state.cr_latitude <= (feedPost[0][4])+2 && this.state.cr_latitude > (feedPost[0][4])-2) && this.state.cr_longitude <= (feedPost[0][5])+2 >  this.state.cr_longitude <= (feedPost[0][5])-2){

                                            return (

                                                <Card className={style.root} style={{ paddingBottom: '2%' }}>
                                                    <div style={{ display: 'flex' }} >
                                                    <IconButton aria-label={`info about ${feedPost[0][4]}`} className={styles.icon}
                                                                    onClick={(event) => {
                                                                    this.buyPhoto(feedPost[0][0], 1000);
                                                                }}
                                                                >
                                                                <MonetizationOnIcon style={{ color: "black",size:'20px'}} />
                                                    </IconButton>
                                                    <CardHeader
                                                        title={this.state.feedPosts[0][0][6]}
                                                        subheader={this.state.feedPosts[0][0][1]}
                                                    />
                                                    </div>
                                                    <div style={{ display: 'flex', backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:svgjs='http://svgjs.com/svgjs' width='1440' height='250' preserveAspectRatio='none' viewBox='0 0 1440 250'%3e%3cg mask='url(%26quot%3b%23SvgjsMask1009%26quot%3b)' fill='none'%3e%3cpath d='M8 250L258 0L384 0L134 250z' fill='url(%23SvgjsLinearGradient1010)'%3e%3c/path%3e%3cpath d='M283.6 250L533.6 0L700.1 0L450.1 250z' fill='url(%23SvgjsLinearGradient1010)'%3e%3c/path%3e%3cpath d='M499.20000000000005 250L749.2 0L864.7 0L614.7 250z' fill='url(%23SvgjsLinearGradient1010)'%3e%3c/path%3e%3cpath d='M731.8000000000001 250L981.8000000000001 0L1137.8000000000002 0L887.8000000000001 250z' fill='url(%23SvgjsLinearGradient1010)'%3e%3c/path%3e%3cpath d='M1415 250L1165 0L844 0L1094 250z' fill='url(%23SvgjsLinearGradient1011)'%3e%3c/path%3e%3cpath d='M1173.4 250L923.4000000000001 0L728.4000000000001 0L978.4000000000001 250z' fill='url(%23SvgjsLinearGradient1011)'%3e%3c/path%3e%3cpath d='M961.8 250L711.8 0L467.29999999999995 0L717.3 250z' fill='url(%23SvgjsLinearGradient1011)'%3e%3c/path%3e%3cpath d='M706.1999999999999 250L456.19999999999993 0L382.69999999999993 0L632.6999999999999 250z' fill='url(%23SvgjsLinearGradient1011)'%3e%3c/path%3e%3cpath d='M1233.9112218438227 250L1440 43.911221843822716L1440 250z' fill='url(%23SvgjsLinearGradient1010)'%3e%3c/path%3e%3cpath d='M0 250L206.08877815617728 250L 0 43.911221843822716z' fill='url(%23SvgjsLinearGradient1011)'%3e%3c/path%3e%3c/g%3e%3cdefs%3e%3cmask id='SvgjsMask1009'%3e%3crect width='1440' height='250' fill='white'%3e%3c/rect%3e%3c/mask%3e%3clinearGradient x1='0%25' y1='100%25' x2='100%25' y2='0%25' id='SvgjsLinearGradient1010'%3e%3cstop stop-color='rgba(185%2c 99%2c 15%2c 0.2)' offset='0'%3e%3c/stop%3e%3cstop stop-opacity='0' stop-color='rgba(185%2c 99%2c 15%2c 0.2)' offset='0.66'%3e%3c/stop%3e%3c/linearGradient%3e%3clinearGradient x1='100%25' y1='100%25' x2='0%25' y2='0%25' id='SvgjsLinearGradient1011'%3e%3cstop stop-color='rgba(185%2c 99%2c 15%2c 0.2)' offset='0'%3e%3c/stop%3e%3cstop stop-opacity='0' stop-color='rgba(185%2c 99%2c 15%2c 0.2)' offset='0.66'%3e%3c/stop%3e%3c/linearGradient%3e%3c/defs%3e%3c/svg%3e")` }} >
                                                        <div>
                                                            <CardMedia className={style.media} >
                                                                <img
                                                                    style={{ marginLeft: '10%', maxWidth: "420px" }}
                                                                    src={feedPost[0][3]}
                                                                />
                                                            </CardMedia>
                                                        </div>
                                                        <div style={{ marginLeft: '5%' }}>
                                                            <CardContent>
                                                                <Typography variant="body2" color="textSecondary" component="p">
                                                                    {this.state.feedPosts[0][0][2]}
                                                                </Typography>
                                                            </CardContent>
                                                            
                                                        </div>
                                                        
                                                    </div>
                                                </Card>

                                                // <Container fluid className={styles.body2}>
                                                //         <Row className={styles.holder}>
                                                //             <Col md={5} className={styles.smallhide}>
                                                //                 <Row className={styles.imagebox}>
                                                //                     <img src={feedPost[0][3]} className={styles.image}/>
                                                //                     <p className={styles.foracc}>
                                                //                         {this.state.feedPosts[0][0][6]}
                                                //                     </p>
                                                //                     <IconButton aria-label={`info about ${feedPost[0][4]}`} className={styles.icon}
                                                //                     onClick={(event) => {
                                                //                     this.buyPhoto(feedPost[0][0], 1000);
                                                //                 }}
                                                //                 >
                                                //                 <MonetizationOnIcon style={{ color: "black",size:'20px'}} />
                                                //             </IconButton>
                                                //                 </Row>
                                                                
                                                //             </Col>
                                                           
                                                //              <Col md={7} className={styles.textCol}>
                                                //                 <p className={styles.heading}>
                                                //                 {this.state.feedPosts[0][0][1]}
                                                //                 </p>
                                                                
                                                //                 <p className={styles.text}>
                                                //                 {this.state.feedPosts[0][0][2]}
                                                //                 </p>

                                                //             </Col>
                                                //         </Row>
                                                //     </Container>






                                                /*
                                                <Card className={style.root} style={{ paddingBottom: '2%' }}>
                                                    <CardHeader
                                                        avatar={
                                                            <Avatar aria-label="recipe" className={style.avatar}>

                                                            </Avatar>
                                                        }
                                                        title={this.state.feedPosts[0][0][6]}
                                                        subheader={this.state.feedPosts[0][0][1]}
                                                    />
                                                    <div style={{ display: 'flex', backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:svgjs='http://svgjs.com/svgjs' width='1440' height='250' preserveAspectRatio='none' viewBox='0 0 1440 250'%3e%3cg mask='url(%26quot%3b%23SvgjsMask1009%26quot%3b)' fill='none'%3e%3cpath d='M8 250L258 0L384 0L134 250z' fill='url(%23SvgjsLinearGradient1010)'%3e%3c/path%3e%3cpath d='M283.6 250L533.6 0L700.1 0L450.1 250z' fill='url(%23SvgjsLinearGradient1010)'%3e%3c/path%3e%3cpath d='M499.20000000000005 250L749.2 0L864.7 0L614.7 250z' fill='url(%23SvgjsLinearGradient1010)'%3e%3c/path%3e%3cpath d='M731.8000000000001 250L981.8000000000001 0L1137.8000000000002 0L887.8000000000001 250z' fill='url(%23SvgjsLinearGradient1010)'%3e%3c/path%3e%3cpath d='M1415 250L1165 0L844 0L1094 250z' fill='url(%23SvgjsLinearGradient1011)'%3e%3c/path%3e%3cpath d='M1173.4 250L923.4000000000001 0L728.4000000000001 0L978.4000000000001 250z' fill='url(%23SvgjsLinearGradient1011)'%3e%3c/path%3e%3cpath d='M961.8 250L711.8 0L467.29999999999995 0L717.3 250z' fill='url(%23SvgjsLinearGradient1011)'%3e%3c/path%3e%3cpath d='M706.1999999999999 250L456.19999999999993 0L382.69999999999993 0L632.6999999999999 250z' fill='url(%23SvgjsLinearGradient1011)'%3e%3c/path%3e%3cpath d='M1233.9112218438227 250L1440 43.911221843822716L1440 250z' fill='url(%23SvgjsLinearGradient1010)'%3e%3c/path%3e%3cpath d='M0 250L206.08877815617728 250L 0 43.911221843822716z' fill='url(%23SvgjsLinearGradient1011)'%3e%3c/path%3e%3c/g%3e%3cdefs%3e%3cmask id='SvgjsMask1009'%3e%3crect width='1440' height='250' fill='white'%3e%3c/rect%3e%3c/mask%3e%3clinearGradient x1='0%25' y1='100%25' x2='100%25' y2='0%25' id='SvgjsLinearGradient1010'%3e%3cstop stop-color='rgba(185%2c 99%2c 15%2c 0.2)' offset='0'%3e%3c/stop%3e%3cstop stop-opacity='0' stop-color='rgba(185%2c 99%2c 15%2c 0.2)' offset='0.66'%3e%3c/stop%3e%3c/linearGradient%3e%3clinearGradient x1='100%25' y1='100%25' x2='0%25' y2='0%25' id='SvgjsLinearGradient1011'%3e%3cstop stop-color='rgba(185%2c 99%2c 15%2c 0.2)' offset='0'%3e%3c/stop%3e%3cstop stop-opacity='0' stop-color='rgba(185%2c 99%2c 15%2c 0.2)' offset='0.66'%3e%3c/stop%3e%3c/linearGradient%3e%3c/defs%3e%3c/svg%3e")` }} >
                                                        <div>
                                                            <CardMedia className={style.media} >
                                                                <img
                                                                    style={{ marginLeft: '10%', maxWidth: "420px" }}
                                                                    src={feedPost[0][3]}
                                                                />
                                                            </CardMedia>
                                                        </div>
                                                        <div style={{ marginLeft: '5%' }}>
                                                            <CardContent>
                                                                <Typography variant="body2" color="textSecondary" component="p">
                                                                    {this.state.feedPosts[0][0][2]}
                                                                </Typography>
                                                                <IconButton aria-label={`info about ${feedPost[0][4]}`} className={style.icon}
                                                                
                                                                onClick={(event) => {
                                                                    console.log(feedPost[0][0])
                                                                    this.buyPhoto(feedPost[0][0], 1000);
                                                                }}
                                                                >
                                                                <MonetizationOnIcon style={{ color: "black" }} />
                                                            </IconButton>
                                                            </CardContent>
                                                        </div>
                                                    </div>
                                                </Card>
                                                */
                                            );
                                        }
                                    })}
                                </div>

                            </div>
                        </div>
                    </div>
                )}
                <br></br>
            </div>
        );
    }
}

export default MarketPlace;