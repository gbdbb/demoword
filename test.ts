// 数字货币投资系统 - AI持仓接口测试（适配Spring Boot）
import axios from 'axios';

// 接口配置（本地后端服务地址）
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' }
});

// 测试AI持仓查询接口
const testAIPosition = async () => {
  try {
    const res = await apiClient.get('/position/query', {
      params: { queryType: 'ai_special', coinTypes: ['BTC', 'ETH'] }
    });
    if (res.data.code === 200) {
      console.log("✅ AI持仓接口调用成功：", res.data.data);
    }
  } catch (err) {
    console.error("❌ 接口测试失败：", err.message);
  }
};

// 执行测试
testAIPosition();