const { ethers } = require('hardhat');

// 从错误信息中获取的调用数据
const callData = '0xfc30e23f00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000d0e31d066e89';

// anonymousPurchase函数的ABI
const functionAbi = {
  "inputs": [
    { "name": "tokenAddress", "type": "address" },
    { "name": "buyAmount", "type": "uint256" }
  ],
  "name": "anonymousPurchase",
  "type": "function"
};

try {
  // 创建接口对象
  const iface = new ethers.Interface([functionAbi]);
  
  // 解码调用数据
  const decoded = iface.parseTransaction({ data: callData });
  
  console.log('Function called:', decoded.name);
  console.log('Parameters:');
  console.log('  tokenAddress:', decoded.args[0]);
  console.log('  buyAmount:', decoded.args[1].toString());
  console.log('  buyAmount (formatted):', ethers.formatUnits(decoded.args[1], 18), 'tokens');
  
  // 计算这个数量对应的USDT成本
  const tokenPrice = 4354000000n; // ETH价格
  const expectedUsdtCost = tokenPrice * decoded.args[1] / BigInt(1e18);
  console.log('Expected USDT cost:', expectedUsdtCost.toString());
  console.log('Expected USDT cost (formatted):', ethers.formatUnits(expectedUsdtCost, 6), 'USDT');

} catch (error) {
  console.error('Failed to decode:', error);
}