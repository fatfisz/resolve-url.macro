const { getPartsFromTemplate } = require('../src/utils');

describe("getPartsFromTemplate", () => {
  it("should work without params", () => {
    expect(getPartsFromTemplate("no-params/zero")).toEqual({
      strings: ["no-params/zero"],
      params: []
    });
  });

  it("should recognise params", () => {
    expect(getPartsFromTemplate("params/${first}-${second}/${third}/")).toEqual(
      {
        strings: ["params/", "-", "/", "/"],
        params: ["first", "second", "third"]
      }
    );
  });

  it("should not throw on extra symbols", () => {
    expect(
      getPartsFromTemplate("p$ar{}ams/${first}-${second}/${third}/")
    ).toEqual({
      strings: ["p$ar{}ams/", "-", "/", "/"],
      params: ["first", "second", "third"]
    });
  });

  it("should allow starting with a param", () => {
    expect(getPartsFromTemplate("${foo}/bar")).toEqual({
      strings: ["", "/bar"],
      params: ["foo"]
    });
  });

  it("should allow ending with a param", () => {
    expect(getPartsFromTemplate("foo/${bar}")).toEqual({
      strings: ["foo/", ""],
      params: ["bar"]
    });
  });

  it("should work with empty string", () => {
    expect(getPartsFromTemplate("")).toEqual({
      strings: [""],
      params: []
    });
  });

  it("should do nothing special if a param is not closed", () => {
    expect(getPartsFromTemplate("${foo/bar")).toEqual({
      strings: ["${foo/bar"],
      params: []
    });
  });
});
