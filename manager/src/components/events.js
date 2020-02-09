import Vue from 'vue'

export const eventBus = new Vue();

eventBus.$on('logoutEvent', () => {
    eventBus.$emit('hideMainRendezvousPoints')   
})

eventBus.$on('loginEvent', () => {
    eventBus.$emit('showMainRendezvousPoints')   
})


export const showMainRendezvousPoints = () => {
    this.hideMainAll()
    this.$root.$emit('showMainRendezvousPoints')
    console.log("Emit: showMainRendezvousPoints")
  }


export const showMainClients = () => {
    this.hideMainAll()
    this.$root.$emit('showMainClients')
    console.log("Emit: showMainClients")
 }

export const  showMainConnections = () => {
    this.hideMainAll()
    this.$root.$emit('showMainConnections')
    console.log("Emit: showMainConnections")
}

export const  hideMainAll = () => {
    eventBus.$emit('hideMainAll')
    console.log("Emit: hideMainAll")
}

export const showLoginWindow = () => {
    this.$root.$emit('showLoginWindow')
    console.log("Emit: showLoginWindow")
}

export const logout = () => {
    this.$root.$emit('logoutEvent')
    console.log("Emit: Logout Event")
}

