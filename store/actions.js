import axios from 'axios'
import Vue from 'vue'
const moment = require('moment')
Vue.use(require('vue-moment'), {
    moment
})
export default {
  async getMember ({state, commit}) {
    await axios.get('http://172.104.189.169:4000/api/getuser/')
    .then (res => {
      let result = res.data
      commit('setMember', result)
    })
  },
  async lastPurchase ({commit}) {
    await axios.get('http://172.104.189.169:4000/api/getcoursepurchase/7')
    .then(res=> {
      let result = res.data
      commit('setLastPurchase', result)
    })
  },
  async getHistoryPurchase ({commit}) {
    console.log('getHistoryPurchase')
      await axios.get('http://172.104.189.169:4000/api/getcourselength')
      .then(res => {
        let result = res.data
        console.log('result: ' + result.length)
        result.forEach(each => {
          axios.get('http://172.104.189.169:4000/api/getchart/' + each.course_id)
          .then(res2 => {
            let result2 = res2.data
            commit('addHistoryPurchase', result2[0])

        })
      })
    })
  },
   pullCourse ({commit, state}) {
    if (state.course.length == 0) {
      axios.get('http://172.104.189.169:4000/api/getcourse')
      .then(res => {
        let result = res.data
        result.map(r => r.youtube = r.youtube.replace('watch?v=','embed/'))
        commit('addCourse', result)
      })
    }
  },
  pullLesson ({commit, state}, courseId) {
    console.log('courseId: ' + courseId)
    let isCheck = false
    state.lesson.find(f => f.course_id == courseId ? isCheck = true : '')
    if (isCheck == false) {
      console.log('load lesson from api')
      axios.get('http://172.104.189.169:4000/api/getlesson/' + courseId)
      .then(res => {
        let result = res.data
        commit('addLesson', result)
      })
    }
  },
  UpdateLesson ({state, commit}, payload) {
    const data = {
      lesson_id: payload.lesson_id,
      title: payload.title,
      description: payload.description,
      cover: payload.cover
    }
    commit('UpdateStoreLesson', data)
    axios.post('http://172.104.189.169:4000/api/updatelesson', data)
  },
  pullAdmin ({commit}) {
    axios.get('http://172.104.189.169:4000/api/getadmin')
    .then (res => {
      let result = res.data
      commit('setadmin', result[0])
    })
  },
  async getlinechart ({commit, dispatch}) {
    let date = Vue.moment().format()
    await axios.get('http://172.104.189.169:4000/api/getcourselength')
    .then(res => {
      let result = res.data
      let count = 0
      result.forEach((each,index,array) => {
        axios.get('http://172.104.189.169:4000/api/yearsales/' + date + '/' + each.course_id)
        .then (res2 => {
          let result2 = res2.data
          axios.get('http://172.104.189.169:4000/api/getcoursename/' + each.course_id)
          .then (res3 => {
            let result3 = res3.data
            result2[0].title = result3[0].title
            commit('addChart', result2[0])
            count ++
            if(count == array.length) {
              dispatch('pullchartdata')
            }
          })
        })
      })
    })
  },
  async pullchartdata ({commit, state}) {
    let month = [];
    let courseItem = [];
    let chartData = [];
    await state.chart.forEach(res=> {
      let strData = Object.values(res)
      let courseName = strData[strData.length - 1]
      let newData = []
      strData.map(each => each == courseName ? '' : newData.push(each))
        const data = {
          name: courseName,
          type: 'line',
          data: newData
        }
        courseItem.push(courseName)
        if (month.length == 0) {
          month = Object.keys(res)
        }
        chartData.push(data)
    })
    await month.pop()
    const mData = {
      month2: month,
      courseItem2:courseItem,
      chartData2:chartData
    }
    commit('setChartsData', mData)
    commit('setLoadChart', false)
  },
  async pullSumPurchase ({ commit }) {
    await axios.get('http://172.104.189.169:4000/api/getlastpurchase/7')
    .then (res => {
      commit('addSumPurchase', res.data[0].sum)
    })
    await axios.get('http://172.104.189.169:4000/api/getlastpurchase/30')
    .then (res => {
      commit('addSumPurchase', res.data[0].sum)
    })
    await axios.get('http://172.104.189.169:4000/api/getlastpurchase/180')
    .then (res => {
      commit('addSumPurchase', res.data[0].sum)
    })
    await axios.get('http://172.104.189.169:4000/api/getlastpurchase/')
    .then (res => {
      commit('addSumPurchase', res.data[0].sum)
    })
  },
  async pullLastChat ({commit}) {
    axios.get('http://172.104.189.169:4000/api/getlastchat/')
    .then (res => {
      let result = res.data
      result.map(each => {
        axios.get('http://172.104.189.169:4000/api/getlastchat/' + each.user_id)
        .then (res2 => {
          let result2 = res2.data
          if (result2[0].type == 'admin') {
            result2[0].text = 'คุณ: ' + result2[0].text
          }
          commit('addChat', result2[0])
        })
      })
    })
  },
  insertChat ({state, commit}, payload) {
    const data = {
      admin_id: payload.admin_id,
      user_id: payload.user_id,
      text: payload.message,
      tstamp: Vue.moment().format('YYYY-MM-DD HH:mm:ss'),
      type: payload.type
    }
    commit('addMessageChat', [data])
    axios.post('http://172.104.189.169:4000/api/postchat', data)
    .then (res => {
      console.log('result: ' + JSON.stringify(res))
    })
  },
  async getChat ({commit, state}, userId) {
    let isCheck = false
    state.messageChat.find(f => f.user_id == userId ? isCheck = true : '')
    if (isCheck == false) {
      axios.get('http://172.104.189.169:4000/api/getchat/' + userId)
      .then (res => {
        let result = res.data
        let reverse = result.reverse()
        commit('addMessageChat', reverse)
      })
    }
  },
  addNewChat ({commit, getters}, userId) {
    let data = getters.getUserFromId(userId)
    commit('addNewChat', data[0])
  },
  getUserCourse ({commit, state}, userId) {
    if (state.userCourse.length == 0) {
      axios.get('http://172.104.189.169:4000/api/usercourse/' + userId)
      .then (res => {
        let result = res.data
        commit('addUserCourse', result)
      })
    } else {
      for (let i = 0; i < state.userCourse[0].length; i++) {
        let isCheck = false
        if (state.userCourse[0][i].user_id == userId) {
          isCheck = true
          console.log('true')
          break
        } else {
          isCheck = false
          console.log('false')
        }
        if (i == state.userCourse[0].length - 1 && isCheck == false) {
          axios.get('http://172.104.189.169:4000/api/usercourse/' + userId)
          .then (res => {
            let result = res.data
            commit('addUserCourse2', result)
          })
        }
      }
    }
  },
  UpdateCourse ({commit}, payload) {
    commit('updateCourse', payload)
    axios.post('http://172.104.189.169:4000/api/updatecourse/', payload)
    .then (res => {
      console.log('result: ' + JSON.stringify(res))
    })
  },
  InsertCourse ({commit}, payload) {
    axios.post('http://172.104.189.169:4000/api/insertcourse/', payload)
    .then (res => {
      console.log('result: ' + JSON.stringify(res))
    })
  },
  UpdateLesson ({commit}, payload) {
    console.log('UpdateLesson: ' + JSON.stringify(payload))
    axios.post('http://172.104.189.169:4000/api/updatelesson/', payload)
    .then (res => {
    })
  },
  DeleteLesson ({commit},payload) {
    const data = {
      lesson_id: payload
    }
    axios.post('http://172.104.189.169:4000/api/deletelesson', data)
  },
  InsertLesson ({commit},payload) {
    console.log('payload: ' + JSON.stringify(payload))
    axios.post('http://172.104.189.169:4000/api/insertlesson', payload)
  },
  UpdateCourse ({commit}, payload) {
    axios.post('http://172.104.189.169:4000/api/updatecourse', payload)
    console.log('UpdateCourse: ' + JSON.stringify(payload))
  },
  pullUserPurchase ({commit, state}, courseId) {
    let isCheck = false
    state.courseLastPurchase.find(f => f.course_id == courseId ? isCheck = true : '')
    if (isCheck == false) {
      axios.get('http://172.104.189.169:4000/api/userpurchase_by_course_id/' + courseId)
      .then(res => {
        let result = res.data
        commit('AddCourseLastPurchase', result)
      })
    }
  }
}