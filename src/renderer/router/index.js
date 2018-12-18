import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: require('@/components/LandingPage').default
    },
    {
      path: '/swagger',
      name: 'swagger-view',
      component: require('@/components/SwaggerView').default
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
