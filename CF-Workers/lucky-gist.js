/*
  API: https://explame.workers.dev/{gist_id}?file={filename}&type={type}
  环境变量: GITHUB_TOKEN
  参数介绍:
  gist_id - 提交的gist id路径
  file - 要提交的文件名称
  type - 提交类型 [ mihomo, ... ]
*/
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// 文件类型处理器注册表 - 可扩展添加更多类型
const handlers = {
  'mihomo': handleMihomoFile
}

/**
 * 主请求处理函数
 * @param {Request} request - 客户端请求对象
 * @return {Response} 响应对象
 */
async function handleRequest(request) {
  const url = new URL(request.url)
  const pathname = url.pathname
  
  // 获取gist_id (现在从路径中获取而不是查询参数)
  // 移除开头的斜杠以获取路径中的gist_id
  const gistId = pathname.substring(1)
  
  if (!gistId) {
    return new Response('缺少gist_id，请使用格式: /{gist_id}?file={filename}', { status: 400 })
  }
  
  const file = url.searchParams.get('file')
  const type = url.searchParams.get('type')
  
  if (!file) {
    return new Response('缺少file参数', { status: 400 })
  }

  const githubToken = GITHUB_TOKEN
  if (!githubToken) {
    return new Response('未配置GitHub token', { status: 500 })
  }
  
  if (request.method === 'GET') {
    return handleGetRequest(file, gistId, githubToken)
  } else if (request.method === 'POST') {
    return handlePostRequest(file, type, gistId, request, githubToken)
  } else {
    return new Response('不支持的请求方法，仅支持GET和POST', { status: 405 })
  }
}

/**
 * 处理GET请求 - 获取文件内容
 * @param {string} file - 文件名
 * @param {string} gistId - Gist ID
 * @param {string} token - GitHub Token
 * @return {Response} 响应对象
 */
async function handleGetRequest(file, gistId, token) {
  const gistResult = await getGist(gistId, token)
  if (!gistResult.success) {
    return new Response(gistResult.message, { status: gistResult.status })
  }
  
  const gistData = gistResult.data
  if (!gistData.files || !gistData.files[file]) {
    return new Response(`Gist中未找到文件: ${file}`, { status: 404 })
  }
  
  const fileRawUrl = gistData.files[file].raw_url
  const fileResult = await getFileContent(fileRawUrl)
  
  if (!fileResult.success) {
    return new Response(fileResult.message, { status: fileResult.status })
  }
  
  return new Response(fileResult.content, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  })
}

/**
 * 处理POST请求 - 上传或更新文件内容
 * @param {string} file - 文件名
 * @param {string} type - 处理类型
 * @param {string} gistId - Gist ID
 * @param {Request} request - 客户端请求对象
 * @param {string} token - GitHub Token
 * @return {Response} 响应对象
 */
async function handlePostRequest(file, type, gistId, request, token) {
  const requestBody = await request.text()
  if (!requestBody) {
    return new Response('请求体为空', { status: 400 })
  }

  const existingGist = await getGist(gistId, token)
  if (!existingGist.success) {
    return new Response(existingGist.message, { status: existingGist.status })
  }

  let contentResult;
  
  if (type && handlers[type]) {
    contentResult = await handlers[type](file, requestBody, existingGist.data, token)
    if (!contentResult.success) {
      return new Response(contentResult.message, { status: contentResult.status })
    }
  } else {
    contentResult = {
      success: true,
      content: requestBody
    }
  }
  
  const updateResult = await updateGistFile(gistId, file, contentResult.content, token)
  if (!updateResult.success) {
    return new Response(updateResult.message, { status: updateResult.status })
  }
  
  return new Response(JSON.stringify({
    success: true,
    message: '文件更新成功',
    gist_id: updateResult.data.id,
    file_url: updateResult.data.files[file].raw_url
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

/**
 * 获取Gist信息
 * @param {string} gistId - Gist ID
 * @param {string} token - GitHub Token
 * @return {Object} 包含请求结果的对象
 */
async function getGist(gistId, token) {
  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'Cloudflare-Worker'
      }
    })
    
    if (response.ok) {
      return {
        success: true,
        data: await response.json()
      }
    } else if (response.status === 404) {
      return {
        success: false,
        message: '未找到指定的gist_id',
        status: 404
      }
    } else {
      return {
        success: false,
        message: '获取gist失败: ' + await response.text(),
        status: response.status
      }
    }
  } catch (error) {
    return {
      success: false,
      message: '获取gist时出错: ' + error.message,
      status: 500
    }
  }
}

/**
 * 更新Gist文件
 * @param {string} gistId - Gist ID
 * @param {string} fileName - 文件名
 * @param {string} content - 文件内容
 * @param {string} token - GitHub Token
 * @return {Object} 包含请求结果的对象
 */
async function updateGistFile(gistId, fileName, content, token) {
  try {
    const gistData = {
      files: {
        [fileName]: {
          content: content
        }
      }
    }
    
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Cloudflare-Worker'
      },
      body: JSON.stringify(gistData)
    })
    
    if (response.ok) {
      return {
        success: true,
        data: await response.json()
      }
    } else {
      return {
        success: false,
        message: '更新gist失败: ' + await response.text(),
        status: response.status
      }
    }
  } catch (error) {
    return {
      success: false,
      message: '更新gist时出错: ' + error.message,
      status: 500
    }
  }
}

/**
 * 获取文件内容
 * @param {string} fileUrl - 文件URL
 * @return {Object} 包含请求结果的对象
 */
async function getFileContent(fileUrl) {
  try {
    const response = await fetch(fileUrl)
    if (response.ok) {
      return {
        success: true,
        content: await response.text()
      }
    } else {
      return {
        success: false,
        message: '获取文件内容失败: ' + await response.text(),
        status: response.status
      }
    }
  } catch (error) {
    return {
      success: false,
      message: '获取文件内容出错: ' + error.message,
      status: 500
    }
  }
}

/**
 * Mihomo配置文件处理器 
 * 处理JSON节点的添加和更新
 * @param {string} fileName - 文件名
 * @param {string} requestBody - 请求体内容
 * @param {Object} gistData - Gist数据对象
 * @param {string} token - GitHub Token
 * @return {Object} 包含处理结果的对象
 */
async function handleMihomoFile(fileName, requestBody, gistData, token) {
  try {
    let requestJson
    try {
      requestJson = JSON.parse(requestBody)
    } catch (e) {
      return {
        success: false,
        message: '请求体不是有效的JSON: ' + e.message,
        status: 400
      }
    }
    
    if (!requestJson.name) {
      return {
        success: false,
        message: 'mihomo类型的请求JSON中缺少"name"字段',
        status: 400
      }
    }
    
    let existingContent = { "proxies": [] }
    
    if (gistData.files && gistData.files[fileName]) {
      const fileRawUrl = gistData.files[fileName].raw_url
      const fileResult = await getFileContent(fileRawUrl)
      
      if (fileResult.success) {
        try {
          existingContent = JSON.parse(fileResult.content)
          
          if (!existingContent.proxies || !Array.isArray(existingContent.proxies)) {
            existingContent.proxies = []
          }
        } catch (e) {
          existingContent = { "proxies": [] }
        }
      }
    }
    
    const nodeIndex = existingContent.proxies.findIndex(p => p.name === requestJson.name)
    
    if (nodeIndex >= 0) {
      existingContent.proxies[nodeIndex] = requestJson
    } else {
      existingContent.proxies.push(requestJson)
    }
    
    return {
      success: true,
      content: JSON.stringify(existingContent, null, 2)
    }
    
  } catch (error) {
    return {
      success: false,
      message: '处理mihomo数据时出错: ' + error.message,
      status: 400
    }
  }
}
