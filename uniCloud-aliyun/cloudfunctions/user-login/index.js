'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
  const { code } = event;
  
  try {
    // 调用微信登录接口获取openid
    const res = await uniCloud.httpclient.request(
      'https://api.weixin.qq.com/sns/jscode2session',
      {
        method: 'GET',
        data: {
          appid: process.env.WX_APPID,
          secret: process.env.WX_SECRET,
          js_code: code,
          grant_type: 'authorization_code'
        },
        dataType: 'json'
      }
    );
    
    const { openid, session_key, errcode } = res.data;

    if (!openid) {
      return {
        code: -1,
        message: errcode === 40029 ? '登录凭证无效' : '登录失败',
        data: null
      };
    }
    
    // 查询用户是否存在
    const userCollection = db.collection('users');
    const { data: users } = await userCollection.where({
      openid: openid
    }).get();
    
    // 如果用户不存在则创建
    if (users.length === 0) {
      await userCollection.add({
        openid: openid,
        nickname: '用户' + openid.substring(0, 6),
        avatar: '',
        dailyCalorieGoal: 2000,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return {
      code: 0,
      message: '登录成功',
      data: {
        openid: openid
      }
    };
  } catch (error) {
    console.error('登录失败:', error);
    return {
      code: -1,
      message: '登录失败: ' + error.message,
      data: null
    };
  }
};
