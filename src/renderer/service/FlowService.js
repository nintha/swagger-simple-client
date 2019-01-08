import Axios from 'axios'
import Qs from "qs";
import { SaferEval } from 'safer-eval';

const myeval = (code, context) => {
  const safer = new SaferEval(context);
  const lines = (code || "").split("\n")
  let retVal = null;
  // 逐条解析
  for (const line of lines) {
    // '\n'是必须的，不然会解析异常
    retVal = safer.runInContext(line + '\n');
  }
  return retVal;
}

/**
 * 检测必填参数，返回缺少的参数数组
 */
const checkLackedParams = (apiInfoParameters, paramValues) => {
  const requiredParams = (apiInfoParameters || []).filter(v => v.required).map(v => v.name);
  return requiredParams.filter(v => !paramValues[v]);
}

const getHost = (url) => {
  const array = url.split("://");
  const subpart = array[1].split("/");
  return `${array[0]}://${subpart[0]}`;
}

/**
 * 替换占位符
 * @param {*} params {paramName: value}
 * @param {*} context 
 */
const solvePlaceholder = (paramValues, context) => {
  const placeholderRegex = /\$\{(.+?)\}/gi;

  const prev = context.card.response ? context.card.response.data : {};
  prev.paramValues = paramValues;

  const evalCtx = {
    prev,
    context
  }

  for (let param in paramValues) {
    let value = paramValues[param];
    if (value && placeholderRegex.test(value)) {
      const matchs = value.match(placeholderRegex);
      matchs.forEach(it => {
        const fieldName = placeholderRegex.exec(it)[1];
        value = value.replace(it, myeval(fieldName, evalCtx));
      });
      paramValues[param] = value;
    }
  }
}

// 断言 
const assert = (condition) => {
  if (!condition) {
    throw new Error("API_FLOW_ASSERT_ERROR::" + JSON.stringify(condition));
  }
}

/**
 * 
 * @param {*} card { method, path, paramValues }
 * @param {*} context 
 */
const sendRequestAsync = async (card, context) => {
  const { methodPath, method, path, paramValues } = card;
  const apiInfoParameters = context.pathDetailMap[methodPath].parameters || [];

  const lacks = checkLackedParams(apiInfoParameters, paramValues)
  if (lacks.length > 0) {
    throw new Error(`Parameters(${lacks.join(", ")}) is required`)
  }

  const url = getHost(context.serverUrl) + path;
  const params = Object.assign({}, paramValues) || [];
  // remove null field
  for (const key in params) {
    if (params[key] === undefined || params[key] === null || params[key] === '') {
      delete params[key];
    }
  }
  try {
    solvePlaceholder(params, context);
    apiInfoParameters.filter(it => it.type === "array").forEach(it => {
      const value = params[it.name];
      if (value) params[it.name] = value.split("\n");
    });
  } catch (error) {
    throw new Error(`Failed to inject parameters, ${error.message}`)
  }

  let res = null;
  try {
    res = await Axios({
      method: method,
      url,
      params: params, // query
      data: params, // formdata
      paramsSerializer: function (params) {
        // 处理array类型参数格式化
        return Qs.stringify(params, { arrayFormat: "repeat" });
      }
    });
  } catch (e) {
    // console.log(e)
    res = e.response;
  }

  return res;
}

/**
 * 
 * @param {*} card {scriptCode, method, path, paramValues}
 * @param {*} context 
 * @returns context
 */
const runCardAsync = async (card, context) => {
  const { scriptCode } = card;
  const rawRes = await sendRequestAsync(card, context)

  // console.log('rawRes',rawRes)
  const response = {
    status: rawRes.status,
    data: rawRes.data
  };

  // 脚本日志记录
  const logContents = [];
  const echo = (...args) => {
    const str = args.map(it => new String(it)).join(" ");
    logContents.push(str);
  };

  const evalCtx = {
    echo,
    response,
    assert
  };
  const scriptResult = {};
  try {
    myeval(scriptCode, evalCtx)
    scriptResult.status = 1;
  } catch (error) {
    scriptResult.status = 2;
    scriptResult.message = error.message;
  }
  scriptResult.logContents = logContents;
  // 把结果存入上下文
  context.card = {
    scriptResult: scriptResult,
    response
  };
  return context;
}

/**
 * 运行flow
 * @param {Object} flow { filename, data, apiInfo, serverUrl }
 * @returns {Object} 
 *  code: 0-ready, 1-success, 2-failed
 *  total: flow.data.length
 *  progress: 进度
 */
const runFlowAsync = async (flow) => {
  const { filename, data, pathDetailMap, serverUrl } = flow;
  // fill lack field
  data.forEach(it => {
    const [method, path] = it.methodPath.split('#');
    it.method = method;
    it.path = path;
  })

  const context = {
    filename,
    pathDetailMap,
    serverUrl,
    card: {}
  };

  // loop cards
  let progress = 0;
  const logList = []
  for (const [index, value] of data.entries()) {
    progress = index + 1;
    await runCardAsync(value, context);
    logList.push(context.card.scriptResult.logContents)
    // failed
    if (context.card.scriptResult.status == 2) {
      break;
    }
  }

  let outputMessage = logList.flatMap(it => it).join("\n")
  if (context.card.scriptResult.message) {
    outputMessage += '\n\nERROR:\n' + context.card.scriptResult.message
  }
  return {
    code: context.card.scriptResult.status, // 0-ready, 1-success, 2-failed
    total: flow.data.length,
    progress,
    outputMessage,
  };
}
/**
 * get random int in [0, max]
 * @param {Number} max 
 */
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max + 1));
}

const delay = time => new Promise(a => setTimeout(a, time))

export default {
  runFlowAsync,
  runCardAsync,
  delay
}