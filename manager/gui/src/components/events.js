import Vue from 'vue'

export const eventBus = new Vue();

export const  hideMainAll = () => {
    console.log("Emit: hideMainAll")
    eventBus.$emit('hideMainRendezvousPoints')
    eventBus.$emit('hideMainClients')
    eventBus.$emit('hideMainWebclients')
    eventBus.$emit('hideMainConnections')
    eventBus.$emit('hideMainWelcome')
    eventBus.$emit('hideMainDownload')
    eventBus.$emit('hideMainStatus')
}

export const  showMainWelcome = () => {
    console.log("Emit: hideMainAll")
    eventBus.$emit('showMainWelcome')
}




export const showMainRendezvousPoints = () => {
    this.hideMainAll()
    eventBus.$emit('showMainRendezvousPoints')
    console.log("Emit: showMainRendezvousPoints")
  }


export const showMainClients = () => {
    this.hideMainAll()
    eventBus.$emit('showMainClients')
    console.log("Emit: showMainClients")
 }

export const  showMainConnections = () => {
    this.hideMainAll()
    eventBus.$emit('showMainConnections')
    console.log("Emit: showMainConnections")
}


export const showLoginWindow = () => {
    eventBus.$emit('showLoginWindow')
    console.log("Emit: showLoginWindow")
}

export const logout = () => {
    eventBus.$emit('logoutEvent')
    console.log("Emit: Logout Event")
}

