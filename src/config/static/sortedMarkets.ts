import { ARBITRUM, ARBITRUM_GOERLI, AVALANCHE, AVALANCHE_FUJI } from "./chains";

/*
  A temporary solution before positions sorting logic is updated 
  to not depend on marketInfo sorting.  

  When adding new markets, add them to the end of the list 
  or update arrays based on marketInfo sorting in runtime
*/
export const SORTED_MARKETS = {
  [ARBITRUM]: [
    "0x47c031236e19d024b42f8AE6780E44A573170703",
    "0x7C11F78Ce78768518D743E81Fdfa2F860C6b9A77",
    "0xd62068697bCc92AF253225676D618B0C9f17C663",
    "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336",
    "0x450bb6774Dd8a756274E0ab4107953259d2ac541",
    "0x0Cf1fb4d1FF67A3D8Ca92c9d6643F8F9be8e03E5",
    "0x09400D9DB990D5ed3f35D7be61DfAEB900Af03C9",
    "0x7f1fa204bb700853D36994DA19F830b6Ad18455C",
    "0x6853EA96FF216fAb11D2d930CE3C508556A4bdc4",
    "0xC25cEf6061Cf5dE5eb761b50E4743c1F5D7E5407",
    "0x1CbBa6346F110c8A5ea739ef2d1eb182990e4EB2",
    "0x55391D178Ce46e7AC8eaAEa50A72D1A5a8A622Da",
    "0x0418643F94Ef14917f1345cE5C460C37dE463ef7",
    "0x0CCB4fAa6f1F1B30911619f1184082aB4E25813c",
    "0x2b477989A149B17073D9C9C82eC9cB03591e20c6",
    "0x63Dc80EE90F26363B3FCD609007CC9e14c8991BE",
    "0xc7Abb2C5f3BF3CEB389dF0Eecd6120D451170B50",
    "0xD9535bB5f58A1a75032416F2dFe7880C30575a41",
    "0x2d340912Aa47e33c90Efb078e69E70EFe2B34b9B",
    "0x7BbBf946883a5701350007320F525c5379B8178A",
    "0x4fDd333FF9cA409df583f306B6F5a7fFdE790739",
    "0x248C35760068cE009a13076D573ed3497A47bCD4",
    "0xB62369752D8Ad08392572db6d0cc872127888beD",
    "0x93385F7C646A3048051914BDFaC25F4d620aeDF1",
    "0xD9377d9B9a2327C7778867203deeA73AB8a68b6B",
    "0xD0a1AFDDE31Eb51e8b53bdCE989EB8C2404828a4",
    "0x77B2eC357b56c7d05a87971dB0188DBb0C7836a5",
    "0x0Bb2a83F995E1E1eae9D7fDCE68Ab1ac55b2cc85",
    "0xD8471b9Ea126272E6d32B5e4782Ed76DB7E554a4",
    "0xdAB21c4d1F569486334C93685Da2b3F9b0A078e8",
    "0x6Ecf2133E2C9751cAAdCb6958b9654baE198a797",
    "0xB489711B1cB86afDA48924730084e23310EB4883",
    "0x66A69c8eb98A7efE22A22611d1967dfec786a708",
    "0xBeB1f4EBC9af627Ca1E5a75981CE1AE97eFeDA22",
    "0x3680D7bFE9260D3c5DE81AEB2194c119a59A99D1",
    "0x15c6eBD4175ffF9EE3c2615c556fCf62D2d9499c",
    "0x872b5D567a2469Ed92D252eaCB0EB3BB0769e05b",
    "0xFaC5fF56c269432706d47DC82Ab082E9AE7D989E",
    "0xe55e1A29985488A2c8846a91E925c2B7C6564db1",
    "0x71237F8C3d1484495A136022E16840b70fF84a69",
    "0xfD46a5702D4d97cE0164375744c65F0c31A3901b",
    "0x6CB901Cc64c024C3Fe4404c940FF9a3Acc229D2C",
    "0x71B7fF592a974e2B501D8A7a11f5c42DcD365244",
    "0xbd48149673724f9caee647bb4e9d9ddaf896efeb",
    "0x784292E87715d93afD7cb8C941BacaFAAA9A5102",
    "0xcaCb964144f9056A8f99447a303E60b4873Ca9B4",
    "0x62feB8Ec060A7dE5b32BbbF4AC70050f8a043C17",
    "0x7B2D09fca2395713dcc2F67323e4876F27b9ecB2",
    "0xdc4e96A251Ff43Eeac710462CD8A9D18Dc802F18",
    "0xe902D1526c834D5001575b2d0Ef901dfD0aa097A",
    "0x4c505e0062459cf8F60FfF13279c92ea15aE6e2D",
    "0xf22CFFA7B4174554FF9dBf7B5A8c01FaaDceA722",
  ],
  [AVALANCHE]: [
    "0x913C1F46b48b3eD35E7dc3Cf754d4ae8499F31CF",
    "0x08b25A2a89036d298D6dB8A74ace9d1ce6Db15E5",
    "0xFb02132333A79C8B5Bd0b64E3AbccA5f7fAf2937",
    "0x3ce7BCDB37Bf587d1C17B930Fa0A7000A0648D12",
    "0xB7e69749E3d2EDd90ea59A4932EFEa2D41E245d7",
    "0x2A3Cf4ad7db715DF994393e4482D6f1e58a1b533",
    "0xd2eFd1eA687CD78c41ac262B3Bc9B53889ff1F70",
    "0x8970B527E84aA17a33d38b65e9a5Ab5817FC0027",
    "0xD1cf931fa12783c1dd5AbB77a0706c27CF352f25",
    "0xA74586743249243D3b77335E15FE768bA8E1Ec5A",
  ],
  [AVALANCHE_FUJI]: [
    "0xbf338a6C595f06B7Cfff2FA8c958d49201466374",
    "0xDdF708B284C5C26BE67Adf9C51DFa935b5035bF8",
    "0xe28323955C05B75E25B56C1c996C1354Eb5Aa13D",
    "0x6d72D2787107c32a48bbA4687Eb8F9C19FE5e29C",
    "0x79E6e0E454dE82fA98c02dB012a2A69103630B07",
    "0x4b6ccF6E429f038087A26b13DD6ab4304F7E5DF1",
    "0xd783EB54407d6d3A4D5c94b634eC9BAE3F574098",
    "0x3b649015Fe0a4d15617e57aA11c0FbbfA03A9e11",
    "0x017de90B0fa830C592805C6148c089191716f04c",
    "0xEDF9Be35bE84cD1e39Bda59Bd7ae8A704C12e06f",
    "0xAC2c6C1b0cd1CabF78B4e8ad58aA9d43375318Cb",
    "0xeDf53322e288F597436f5d5849771662AEe16A1C",
    "0xE446E8f7074c0A97bb7cd448fA2CC3346045F514",
    "0xD996ff47A1F763E1e55415BC4437c59292D1F415",
  ],
  [ARBITRUM_GOERLI]: [],
};