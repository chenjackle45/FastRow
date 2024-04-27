const siteConfigs = {
  "readingoutpost.com": {
    excludeSelectors: ["#wpj-jtoc", ".wpulike"],
    contentSelector: ".single-content",
  },
  "read.readwise.io": {
    excludeSelectors: [],
    contentSelector: "#document-text-content", // 使用 body 作為預設的內容選擇器
  },
  other: {
    excludeSelectors: [],
    contentSelector: "body", // 使用 body 作為預設的內容選擇器
  },
};

// 定義兩個變數，一個表示是否啟動速讀模式，另一個表示當前的速讀速度
let isActive = false;
let currentSpeed = 300; // Default speed in ms

function calculateTimeout(wordsPerMinute) {
  const wordsPerSecond = wordsPerMinute / 60; // 每秒阅读的字数
  const millisecondsPerWord = 1000 / wordsPerSecond; // 每个字的显示时间（毫秒）
  return millisecondsPerWord * 10;
}

// 監聽來自 Chrome 擴充功能的訊息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "toggle") {
    currentSpeed = calculateTimeout(request.speed);
    console.log("Current speed:", currentSpeed);
    toggleSpeedRead(request.domain);
    sendResponse({ status: "啟動" });
  }
  return true;
});

function toggleSpeedRead(domain) {
  isActive = !isActive;
  const config = siteConfigs[domain] || siteConfigs.other; // 如果 siteConfigs[domain] 不存在，則使用 siteConfigs.other

  // 找到所有指定的内容元素
  const contentElements = document.querySelectorAll(config.contentSelector);
  if (isActive) {
    // 启动速读模式：包裹文字并设置为透明
    wrapTextWithTransparentSpan(contentElements[0], config.excludeSelectors);
    revealText(contentElements[0]);
  } else {
    // 关闭速读模式：移除透明设置
    unwrapTextFromSpan(contentElements[0]);
  }
}

function wrapTextWithTransparentSpan(element, excludeSelectors) {
  const textNodes = findAllTextNodes(element, excludeSelectors);
  textNodes.forEach((node) => {
    const parent = node.parentNode;
    const chars = node.textContent.split("");
    node.textContent = "";

    chars.forEach((char) => {
      const span = document.createElement("span");
      span.textContent = char;
      span.style.color = "transparent";
      parent.insertBefore(span, node);
    });
    parent.removeChild(node);
  });
}

function unwrapTextFromSpan(elements) {
  const spans = elements.querySelectorAll("span");
  spans.forEach((span) => {
    const parent = span.parentNode;
    if (parent) {
      parent.insertBefore(document.createTextNode(span.textContent), span);
      parent.removeChild(span);
    }
  });
}

// findAllTextNodes 函數和 revealText 函數保持不變
function findAllTextNodes(element, excludeSelectors) {
  let nodes = [];
  for (const node of element.childNodes) {
    if (node.nodeType === 1) {
      // 当 excludeSelectors 为空时，不应执行匹配检查
      if (
        excludeSelectors.length > 0 &&
        excludeSelectors.some((selector) => node.matches(selector))
      ) {
        continue; // 如果节点匹配任何排除选择器，则跳过此节点
      }
      // 递归查找子节点
      nodes = nodes.concat(findAllTextNodes(node, excludeSelectors));
    } else if (node.nodeType === 3 && node.textContent.trim().length > 0) {
      nodes.push(node); // 将符合条件的文本节点添加到数组中
    }
  }
  return nodes;
}

function revealText(elements) {
  const spans = Array.from(elements.querySelectorAll("span"));
  let currentSpan = 0;

  function displayNextSpan() {
    if (!isActive || currentSpan >= spans.length) {
      return; // 如果不是激活状态或者已经处理完所有span，停止执行
    }

    // 更新当前批次的10个span
    const endSpan = Math.min(currentSpan + 12, spans.length); // 计算当前批次结束的位置
    for (let i = currentSpan; i < endSpan; i++) {
      spans[i].style.color = ""; // 将颜色设置为默认颜色，即可见
    }
    currentSpan = endSpan; // 更新currentSpan到下一批次的开始位置

    console.log("currentSpeed = ", currentSpeed);
    setTimeout(displayNextSpan, currentSpeed); // 延时后继续处理下一批次
  }

  displayNextSpan(); // 开始执行
}
