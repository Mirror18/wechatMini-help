'use strict';

let accessToken = '';
let tokenExpireTime = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpireTime) {
    return accessToken;
  }

  const apiKey = process.env.BAIDU_API_KEY;
  const secretKey = process.env.BAIDU_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error('Missing BAIDU_API_KEY or BAIDU_SECRET_KEY env vars');
  }

  const res = await uniCloud.httpclient.request(
    'https://aip.baidubce.com/oauth/2.0/token',
    {
      method: 'GET',
      data: {
        grant_type: 'client_credentials',
        client_id: apiKey,
        client_secret: secretKey,
      },
      dataType: 'json',
    }
  );

  if (!res.data || !res.data.access_token) {
    throw new Error('Failed to get Baidu access token: ' + JSON.stringify(res.data));
  }

  accessToken = res.data.access_token;
  tokenExpireTime = Date.now() + (res.data.expires_in - 60) * 1000;
  return accessToken;
}

exports.main = async (event, context) => {
  const { image, topNum = 5, filterThreshold = 0.7 } = event;

  if (!image) {
    return { code: -1, message: '缺少图片参数', data: null };
  }

  try {
    const token = await getAccessToken();
    const res = await uniCloud.httpclient.request(
      'https://aip.baidubce.com/rest/2.0/image-classify/v1/dish',
      {
        method: 'POST',
        data: {
          image,
          top_num: topNum,
          filter_threshold: filterThreshold,
          access_token: token,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        dataType: 'json',
      }
    );

    return {
      code: 0,
      message: '识别成功',
      data: res.data,
    };
  } catch (error) {
    console.error('Baidu dish recognize error:', error);
    return {
      code: -1,
      message: '识别失败: ' + error.message,
      data: null,
    };
  }
};
