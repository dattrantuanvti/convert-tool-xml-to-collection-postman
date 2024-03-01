const REGEX_CHANGE_VAR_FORMAT = /\${(.*?)}/g;

export function convertXmlToCollection(textXml, scenarioName) {
  const xmlFormatString = textXml.replaceAll("#", "//");
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlFormatString, "application/xml");
  const rootName = xmlDoc.querySelector("Name").textContent?.trim();
  const webApiListTag = xmlDoc.querySelectorAll("WebApiList");
  const webApis = webApiListTag[0]?.querySelectorAll("DarRepoWebApi");

  const items = [];
  webApis.forEach((element, index) => {
    const scenarioStepName = element.querySelector("Name")?.textContent?.trim();
    const indexOfStep = `00${index + 1}`.slice(-3);
    const name = `${indexOfStep}_${scenarioName}_${scenarioStepName}`;
    const method = element.querySelector("HttpMethod")?.textContent?.trim();
    const headers = [];
    const headerElm = element.querySelector("RequestHeader");
    const listHeaderElms = headerElm.querySelectorAll(
      "DarRepoWebApiRequestHeader"
    );
    let headerIsXmlType = false;

    // Create headers
    listHeaderElms.forEach((headerElm) => {
      const key = headerElm.querySelector("Key")?.textContent?.trim();
      const value = headerElm.querySelector("Value")?.textContent?.trim();
      const isEnabled =
        headerElm.querySelector("Enabled")?.textContent?.trim() === "true";
      if (value.includes("xml")) headerIsXmlType = true;
      headers.push({
        key,
        value: value.replace(REGEX_CHANGE_VAR_FORMAT, "{{$1}}"),
        type: "text",
        ...(!isEnabled && { disabled: true }),
      });
    });

    const body = element.querySelector("RequestBody")?.textContent;
    // EXTRACT HEADER
    const rawUrl =
      element.querySelector("HttpUrl")?.textContent?.trim() || "INVALID_URL";
    let hostUrl;
    let path;
    if (rawUrl.startsWith("http")) {
      const pathUrl = rawUrl.split("://")[1];
      hostUrl = "http://" + pathUrl.split("/")[0];
      path = pathUrl.split("/").splice(1);
    } else {
      hostUrl = rawUrl.split("/")[0].replace(REGEX_CHANGE_VAR_FORMAT, "{{$1}}");
      path = rawUrl.split("/").splice(1);
    }
    const description = element
      .querySelector("Description")
      ?.textContent?.trim();

    // TEST SCRIPT
    const expectElm = element.querySelector("Expect");
    const expectCodeValue = expectElm
      .querySelector("ExpectHttpCode")
      ?.textContent?.trim();
    const isValidExpect =
      expectElm.querySelector("IsValidExpect")?.textContent?.trim() === "true";
    const isExpectHttpCode =
      expectElm.querySelector("IsValidExpectHttpCode")?.textContent?.trim() ===
      "true";

    const checkStatusArr = [
      `pm.test("Status code is ${
        isExpectHttpCode ? "not" : ""
      } ${expectCodeValue}", function () {\r`,
      `    pm.response.to${
        !isExpectHttpCode ? ".not" : ""
      }.have.status(${expectCodeValue});\r`,
      "});\r",
    ];
    const expectValue = expectElm
      .querySelector("ExpectValue")
      ?.textContent?.trim();

    const checkExpectValueArr = [
      `var expectedJson = ${expectValue}`,
      `pm.test("Response JSON matches ${
        isValidExpect ? "" : "not"
      } expected JSON", function () {\r`,
      `pm.expect(JSON.stringify(actualJson))${
        isValidExpect ? "" : ".not"
      }.to.eql(JSON.stringify(expectValue));\r`,
      "});\r",
    ];

    const fetchVariableElm = element.querySelector("FetchVariables");
    const listConfigVariable = fetchVariableElm.querySelectorAll(
      "DarRepoWebApiFetchConfig"
    );
    const configSetVars = [...listConfigVariable]?.map((item) => {
      const configVarValue = item
        .querySelector("FetchDefine")
        ?.textContent?.trim()
        .replace("$", "");
      const fetchVariableKey = item
        .querySelector("FetchVariable")
        ?.textContent?.trim();
      const key = fetchVariableKey.replace(REGEX_CHANGE_VAR_FORMAT, "$1");
      const init = `pm.environment.set(\"${key}\", actualJson${configVarValue});`;
      return init;
    });
    const exec = [
      ...(expectCodeValue ? checkStatusArr : []),
      ...(expectValue ? checkExpectValueArr : []),
      ...([...listConfigVariable]?.length > 0 ? configSetVars : []),
    ];
    if (
      !!expectCodeValue ||
      !!expectValue ||
      [...listConfigVariable]?.length > 0
    ) {
      exec.unshift("var actualJson = pm.response.json();\r");
    }
    const item = {
      name,
      event: [
        {
          listen: "test",
          script: {
            exec,
            type: "text/javascript",
          },
        },
      ],
      request: {
        method,
        header: headers,
        body: {
          mode: "raw",
          raw: JSON.parse(
            JSON.stringify(
              body
                .replace(/(\t)/g, "")
                .replace(REGEX_CHANGE_VAR_FORMAT, "{{$1}}")
                .replace(/(.*?),\s*(\}|])/g, "$1$2")
            )
          ),
          options: {
            raw: {
              language: headerIsXmlType ? "xml" : "json",
            },
          },
        },
        url: {
          raw: rawUrl.replace(REGEX_CHANGE_VAR_FORMAT, "{{$1}}"),
          host: hostUrl,
          path,
        },
        description,
      },
    };
    items.push(item);
  });

  return {
    name: rootName,
    item: items,
  };
}
