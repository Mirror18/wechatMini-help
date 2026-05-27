'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
  const { action, ...data } = event;
  // 必须通过微信认证
  const { OPENID } = context.auth;
  if (!OPENID) {
    return {
      code: -1,
      message: '未授权访问',
      data: null
    };
  }
  
  try {
    const recordCollection = db.collection('food_records');
    
    switch (action) {
      case 'add': {
        const { record } = data;
        const result = await recordCollection.add({
          ...record,
          userId: OPENID,
          createdAt: new Date()
        });
        
        return {
          code: 0,
          message: '添加成功',
          data: { _id: result.id }
        };
      }
      
      case 'list': {
        const { date } = data;
        const userId = OPENID;
        
        const { data: records } = await recordCollection.where({
          userId: userId,
          date: date
        })
        .orderBy('createdAt', 'desc')
        .get();
        
        return {
          code: 0,
          message: '获取成功',
          data: records
        };
      }
      
      case 'delete': {
        const { id } = data;
        // 校验记录所有权后再删除
        const { data: records } = await recordCollection.where({
          _id: id,
          userId: OPENID
        }).get();
        if (records.length === 0) {
          return {
            code: -1,
            message: '记录不存在或无权限删除',
            data: null
          };
        }
        await recordCollection.doc(id).remove();
        
        return {
          code: 0,
          message: '删除成功',
          data: null
        };
      }
      
      case 'stats': {
        const { startDate, endDate } = data;
        const userId = OPENID;
        
        const { data: records } = await recordCollection.where({
          userId: userId,
          date: db.command.gte(startDate).and(db.command.lte(endDate))
        }).get();
        
        const totalCalories = records.reduce((sum, r) => sum + (r.calories || 0), 0);
        const totalProtein = records.reduce((sum, r) => sum + (r.protein || 0), 0);
        const totalFat = records.reduce((sum, r) => sum + (r.fat || 0), 0);
        const totalCarbs = records.reduce((sum, r) => sum + (r.carbs || 0), 0);
        
        const days = new Set(records.map(r => r.date)).size || 1;
        const avgCalories = Math.round(totalCalories / days);
        
        // 按日期分组
        const dailyMap = {};
        records.forEach(r => {
          if (!dailyMap[r.date]) {
            dailyMap[r.date] = 0;
          }
          dailyMap[r.date] += r.calories || 0;
        });
        
        const dailyBreakdown = Object.entries(dailyMap).map(([date, calories]) => ({
          date,
          calories: Math.round(calories)
        })).sort((a, b) => a.date.localeCompare(b.date));
        
        return {
          code: 0,
          message: '获取成功',
          data: {
            totalCalories: Math.round(totalCalories),
            avgCalories,
            totalProtein: Math.round(totalProtein * 10) / 10,
            totalFat: Math.round(totalFat * 10) / 10,
            totalCarbs: Math.round(totalCarbs * 10) / 10,
            dailyBreakdown
          }
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
