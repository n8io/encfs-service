module.exports = {
  apps : [{
    name       : "api-encfs",
    script     : "npm",
    args       : "start",
    watch      : true,
    env        : {
      PORT: 1980
    }
  }]
};
