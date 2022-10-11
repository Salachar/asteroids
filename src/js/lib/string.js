const StringHelpers = {
  hypenToCamelCase: (string) => {
    return string.replace(/-([a-z])/gi, (s, group1) => {
      return group1.toUpperCase();
    });
  },
}

module.exports = StringHelpers;
