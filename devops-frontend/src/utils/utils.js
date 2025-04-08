export function setLastLoginTime() {
    const currentTime = new Date().getTime();
    localStorage.setItem("login_time", currentTime.toString());
  }
  
  export function hasTokenExpired(){
    const lastLoginTimeString = localStorage.getItem("login_time");
    if (!lastLoginTimeString) return true;
  
    const lastLoginTime = parseInt(lastLoginTimeString);
    const currentTime = new Date().getTime();
  
    if (isNaN(lastLoginTime)) return true;
  
    const timeDifference = currentTime - lastLoginTime;
    //24 hrs in ms
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
  
    return timeDifference >= twentyFourHoursInMs;
  }
  