/*
  API: https://explame.workers.dev?file={filename}&type={type}&gist_id={gist_id}
  环境变量: GITHUB_TOKEN
  参数介绍:
  gist_id - 提交的gist id路径
  file - 要提交的文件名称
  type - 提交类型 [ wireguard, mihomo, ... ]
*/
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// 文件类型处理器注册表
const handlers = {
  'wireguard': handleWireguardFile,
  'mihomo': handleMihomoFile
  // 可以在这里注册更多类型的处理器
}

async function handleRequest(request) {
  // 只处理POST请求
  if (request.method !== 'POST') {
    return new Response('请使用POST方法。', { status: 405 })
  }

  try {
    // 获取请求参数
    const url = new URL(request.url)
    const file = url.searchParams.get('file')
    const type = url.searchParams.get('type')
    const gistId = url.searchParams.get('gist_id')

    // 验证参数
    if (!file) {
      return new Response('缺少file参数', { status: 400 })
    }
    
    if (!type) {
      return new Response('缺少type参数', { status: 400 })
    }
    
    // 检查处理器是否存在
    if (!handlers[type]) {
      return new Response(`不支持的文件类型: ${type}。支持的类型: ${Object.keys(handlers).join(', ')}`, { status: 400 })
    }

    if (!gistId) {
      return new Response('缺少gist_id参数', { status: 400 })
    }

    // 获取请求体
    const requestBody = await request.text()
    if (!requestBody) {
      return new Response('请求体为空', { status: 400 })
    }

    // 获取GitHub Token
    const githubToken = GITHUB_TOKEN
    if (!githubToken) {
      return new Response('未配置GitHub token', { status: 500 })
    }

    // 获取gist信息
    const existingGist = await getGist(gistId, githubToken)
    if (!existingGist.success) {
      return new Response(existingGist.message, { status: existingGist.status })
    }

    // 调用对应类型的处理器处理文件内容
    const contentResult = await handlers[type](file, requestBody, existingGist.data, githubToken)
    if (!contentResult.success) {
      return new Response(contentResult.message, { status: contentResult.status })
    }
    
    // 更新gist
    const updateResult = await updateGistFile(gistId, file, contentResult.content, githubToken)
    if (!updateResult.success) {
      return new Response(updateResult.message, { status: updateResult.status })
    }
    
    // 返回成功消息
    return new Response(JSON.stringify({
      success: true,
      message: '文件更新成功',
      gist_id: updateResult.data.id,
      file_url: updateResult.data.files[file].raw_url
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    return new Response('错误: ' + error.message, { status: 500 })
  }
}

/**
 * 获取Gist信息
 */
async function getGist(gistId, token) {
  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'Node.js Latest'
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
 * Wireguard文件处理器
 * 直接将请求体内容作为文件内容
 */
async function handleWireguardFile(fileName, requestBody, gistData, token) {
  // 对于wireguard，直接使用请求体作为文件内容
  return {
    success: true,
    content: requestBody
  }
}

/**
 * Mihomo文件处理器 
 * 处理JSON节点的添加和更新
 */
async function handleMihomoFile(fileName, requestBody, gistData, token) {
  try {
    // 解析请求体JSON
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
    
    // 默认内容结构
    let existingContent = { "proxies": [] }
    
    // 检查文件是否已存在于gist中
    if (gistData.files && gistData.files[fileName]) {
      const fileRawUrl = gistData.files[fileName].raw_url
      const fileResult = await getFileContent(fileRawUrl)
      
      if (fileResult.success) {
        try {
          existingContent = JSON.parse(fileResult.content)
          
          // 确保proxies字段存在且是数组
          if (!existingContent.proxies || !Array.isArray(existingContent.proxies)) {
            existingContent.proxies = []
          }
        } catch (e) {
          // 如果解析失败，使用默认结构
          existingContent = { "proxies": [] }
        }
      }
    }
    
    // 查找是否存在同名节点
    const nodeIndex = existingContent.proxies.findIndex(p => p.name === requestJson.name)
    
    if (nodeIndex >= 0) {
      // 替换已存在的节点
      existingContent.proxies[nodeIndex] = requestJson
    } else {
      // 添加新节点
      existingContent.proxies.push(requestJson)
    }
    
    // 返回处理后的内容
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
