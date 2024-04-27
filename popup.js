// 假設你有一個函數來檢查當前網站是否為經過優化的速讀練習網站
function isOptimizedSite(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    var url = new URL(tab.url);
    var domain = url.hostname; // 获取域名

    const optimizedSites = ["readingoutpost.com", "read.readwise.io"];
    const isOptimized = optimizedSites.includes(domain);

    callback(isOptimized); // 调用回调函数，并传递是否优化的状态
  });
}

// 使用回调更新 UI
isOptimizedSite(function (isOptimized) {
  document.getElementById("optimized-site").textContent = isOptimized
    ? "本網站經過優化處理"
    : "本網站未經過優化，可能無法預期文字會從哪裡開始";
});

// 為 id 為 "toggle" 的元素添加點擊事件監聽器
document.getElementById("toggle").addEventListener("click", () => {
  // 打印一條訊息，表示正在切換速讀模式
  // 從 id 為 "speed" 的元素中獲取速讀速度
  const speed = document.getElementById("speed").value;
  // 打印一條訊息，顯示正在切換的速讀速度
  // 查詢當前窗口的活動標籤頁
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    // 獲取活動標籤頁
    var tab = tabs[0];
    var url = new URL(tab.url);
    var domain = url.hostname; // 获取域名

    // 向當前活動標籤頁發送消息
    chrome.tabs.sendMessage(
      tab.id,
      { action: "toggle", speed: speed, domain: domain },
      function (response) {
        if (chrome.runtime.lastError) {
          console.error(
            "Error sending message:",
            chrome.runtime.lastError.message
          );
        } else {
          console.log("Message sent:", response);
        }
      }
    );
  });
});

document.addEventListener("DOMContentLoaded", function () {
  var speedInput = document.getElementById("speed");
  var speedLabel = document.querySelector('label[for="speed"]');

  // 載入速讀設置
  loadSpeedSetting(function (speed) {
    // 更新 input 和 label 的值
    speedInput.value = speed;
    speedLabel.textContent = "每分鐘閱讀 " + speed + " 字";
  });

  // 初始化 label 文字
  speedLabel.textContent = "每分鐘閱讀 " + speedInput.value + " 字";

  // 當 input 值改變時，更新 label 文字
  speedInput.addEventListener("input", function () {
    speedLabel.textContent = "每分鐘閱讀 " + speedInput.value + " 字";
  });
});

// 獲取按鈕元素
var toggleButton = document.getElementById("toggle");

// 為按鈕添加點擊事件監聽器
toggleButton.addEventListener("click", function () {
  // 檢查按鈕的文字，並根據當前的文字來更新它
  if (toggleButton.textContent === "開始速讀") {
    // 儲存速度值
    saveSpeedSetting(document.getElementById("speed").value);
    toggleButton.textContent = "停止速讀";
  } else {
    toggleButton.textContent = "開始速讀";
  }
});

function saveSpeedSetting(speed) {
  chrome.storage.local.set({ speed: speed }, function () {
    console.log("Speed setting saved:", speed);
  });
}

function loadSpeedSetting(callback) {
  chrome.storage.local.get(["speed"], function (result) {
    if (result.speed) {
      console.log("Loaded speed setting:", result.speed);
      callback(result.speed);
    } else {
      console.log("No speed setting found, using default.");
      callback(300); // 默认值
    }
  });
}
