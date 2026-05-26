'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
  const { action, openid, ...data } = event;
  
  try {
    const userCollection = db.collection('users');
    
    switch (action) {
      case 'get': {
        const { data: users } = await userCollection.where({
          openid: openid
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
        
        if (nickname !== undefined) updateData.nickname = nickname;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (dailyCalorieGoal !== undefined) updateData.dailyCalorieGoal = dailyCalorieGoal;
        
        await userCollection.where({
          openid: openid
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
