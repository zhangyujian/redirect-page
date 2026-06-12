(() => {
  const elements = {
    form: document.querySelector("#barcode-form"),
    value: document.querySelector("#barcode-value"),
    format: document.querySelector("#barcode-format"),
    width: document.querySelector("#barcode-width"),
    height: document.querySelector("#barcode-height"),
    lineColor: document.querySelector("#line-color"),
    backgroundColor: document.querySelector("#background-color"),
    displayValue: document.querySelector("#display-value"),
    output: document.querySelector("#barcode-output"),
    errorState: document.querySelector("#error-state"),
    error: document.querySelector("#value-error"),
    charCount: document.querySelector("#char-count"),
    widthOutput: document.querySelector("#width-output"),
    heightOutput: document.querySelector("#height-output"),
    lineColorValue: document.querySelector("#line-color-value"),
    backgroundColorValue: document.querySelector("#background-color-value"),
    formatHint: document.querySelector("#format-hint"),
    clear: document.querySelector("#clear-value"),
    png: document.querySelector("#download-png"),
    svg: document.querySelector("#download-svg"),
    copy: document.querySelector("#copy-image"),
    toast: document.querySelector("#toast"),
  };

  const formatInfo = {
    CODE128: ["690123456789", "支持数字、英文及常用符号，适合大多数场景。"],
    CODE39: ["CODE39-123", "支持大写字母、数字及部分符号。"],
    EAN13: ["690123456789", "请输入 12 位数字，最后一位校验码将自动生成。"],
    EAN8: ["1234567", "请输入 7 位数字，最后一位校验码将自动生成。"],
    UPC: ["12345678901", "请输入 11 位数字，最后一位校验码将自动生成。"],
    ITF14: ["1234567890123", "请输入 13 位数字，适用于物流包装。"],
    MSI: ["123456789", "仅支持数字，常用于库存管理。"],
    pharmacode: ["1234", "请输入 3 到 131070 之间的数字。"],
    codabar: ["A123456A", "支持数字、-$:/.+，通常以 A-D 开始和结束。"],
  };

  let validBarcode = false;
  let toastTimer;

  function setActionsEnabled(enabled) {
    [elements.png, elements.svg, elements.copy].forEach((button) => {
      button.disabled = !enabled;
    });
  }

  function updateLabels() {
    elements.charCount.textContent = `${elements.value.value.length} / 80`;
    elements.widthOutput.textContent = `${elements.width.value} px`;
    elements.heightOutput.textContent = `${elements.height.value} px`;
    elements.lineColorValue.textContent = elements.lineColor.value.toUpperCase();
    elements.backgroundColorValue.textContent = elements.backgroundColor.value.toUpperCase();
  }

  function generateBarcode() {
    updateLabels();
    const value = elements.value.value.trim();

    if (!value) {
      elements.error.textContent = "请输入需要生成条形码的内容。";
      elements.output.hidden = true;
      elements.errorState.hidden = false;
      validBarcode = false;
      setActionsEnabled(false);
      return;
    }

    try {
      JsBarcode(elements.output, value, {
        format: elements.format.value,
        width: Number(elements.width.value),
        height: Number(elements.height.value),
        lineColor: elements.lineColor.value,
        background: elements.backgroundColor.value,
        displayValue: elements.displayValue.checked,
        font: "Arial, sans-serif",
        fontSize: 17,
        textMargin: 8,
        margin: 14,
        valid(valid) {
          if (!valid) throw new Error("INVALID_BARCODE");
        },
      });

      elements.error.textContent = "";
      elements.output.hidden = false;
      elements.errorState.hidden = true;
      validBarcode = true;
      setActionsEnabled(true);
    } catch (error) {
      elements.error.textContent = "当前内容不符合该条码格式，请参考格式说明。";
      elements.output.hidden = true;
      elements.errorState.hidden = false;
      validBarcode = false;
      setActionsEnabled(false);
    }
  }

  function getSvgSource() {
    const clone = elements.output.cloneNode(true);
    clone.removeAttribute("hidden");
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return new XMLSerializer().serializeToString(clone);
  }

  function downloadBlob(blob, extension) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = elements.value.value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 36) || "barcode";
    link.href = url;
    link.download = `barcode-${safeName}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function svgToPngBlob(scale = 3) {
    return new Promise((resolve, reject) => {
      const svgBlob = new Blob([getSvgSource()], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width * scale;
        canvas.height = image.height * scale;
        const context = canvas.getContext("2d");
        context.scale(scale, scale);
        context.drawImage(image, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG_EXPORT_FAILED")), "image/png");
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("SVG_LOAD_FAILED"));
      };
      image.src = url;
    });
  }

  function showToast(message, isError = false) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.style.color = isError ? "#d92d20" : "#16804f";
    elements.toast.classList.add("show");
    toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2200);
  }

  elements.form.addEventListener("input", generateBarcode);
  elements.format.addEventListener("change", () => {
    const [sample, hint] = formatInfo[elements.format.value];
    elements.value.value = sample;
    elements.formatHint.textContent = hint;
    generateBarcode();
  });
  elements.clear.addEventListener("click", () => {
    elements.value.value = "";
    elements.value.focus();
    generateBarcode();
  });
  elements.svg.addEventListener("click", () => {
    if (!validBarcode) return;
    downloadBlob(new Blob([getSvgSource()], { type: "image/svg+xml;charset=utf-8" }), "svg");
    showToast("SVG 文件已下载");
  });
  elements.png.addEventListener("click", async () => {
    if (!validBarcode) return;
    try {
      downloadBlob(await svgToPngBlob(), "png");
      showToast("高清 PNG 已下载");
    } catch (error) {
      showToast("下载失败，请重试", true);
    }
  });
  elements.copy.addEventListener("click", async () => {
    if (!validBarcode) return;
    try {
      if (!navigator.clipboard || !window.ClipboardItem) throw new Error("CLIPBOARD_UNSUPPORTED");
      const blob = await svgToPngBlob(2);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      showToast("条形码图片已复制");
    } catch (error) {
      showToast("浏览器不支持复制图片，请下载使用", true);
    }
  });

  generateBarcode();
})();
