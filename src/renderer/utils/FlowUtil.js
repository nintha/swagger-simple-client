
const runCard = async (card, context) => {
  // 把结果存入上下文
  // context.card = {
  //   scriptResult,
  //   response
  // };
  return context;
}

const runFlowAsync = async (flow) => {
  const code = getRandomInt(1) + 1
  return {
    code: code, // 0-ready, 1-success, 2-failed
    total: flow.data.length,
    progress: code === 1 ? flow.data.length : getRandomInt(flow.data.length - 1) + 1,
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
  delay
}