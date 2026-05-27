'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
  // 必须通过微信认证，禁止客户端传入 openid 参数
  const { OPENID } = context.auth
  if (!OPENID) {
    return {
      code: -1,
      message: '未授权访问',
      data: null
    };
  }

  const { action, ...data } = event;
  
  try {
    const userCollection = db.collection('users');
    
    switch (action) {
      case 'get': {
        const { data: users } = await userCollection.where({
          openid: OPENID
        }).get();
        
        if (users.length === 0) {
          return {
            code: -1,
            message: '用户不存在',
            data: null
          };
        }
        
        return {
          code: 0,
          message: '获取成功',
          data: users[0]
        };
      }
      
      case 'update': {
        const { nickname, avatar, dailyCalorieGoal } = data;
        const updateData = {
          updatedAt: new Date()
        };

        if (nickname !== undefined) {
          if (typeof nickname !== 'string' || nickname.length > 50) {
            return { code: -1, message: '昵称长度不能超过50个字符', data: null };
          }
          updateData.nickname = nickname;
        }
        if (avatar !== undefined) updateData.avatar = avatar;
        if (dailyCalorieGoal !== undefined) {
          const goal = Number(dailyCalorieGoal);
          if (isNaN(goal) || goal < 500 || goal > 10000) {
            return { code: -1, message: '热量目标应在500-10000千卡之间', data: null };
          }
          updateData.dailyCalorieGoal = goal;
        }
        
        await userCollection.where({
          openid: OPENID
        }).update(updateData);
        
        return {
          code: 0,
          message: '更新成功',
          data: null
        };
      }
      
      default:
        return {
          code: -1,
          message: '未知操作',
          data: null
        };
    }
  } catch (error) {
    console.error('操作失败:', error);
    return {
      code: -1,
      message: '操作失败: ' + error.message,
      data: null
    };
  }
};
