<template>
  <Card>
    <div slot="title">
      Swagger Simple Client
    </div>
    <Input
      search
      enter-button="Fetch"
      placeholder="Swagger Json URL..."
      v-model="serverUrl"
      @on-search="jumpPage"
    />
  </Card>
</template>

<script>
const KEY_SERVER_URL = 'API_DOCS_URL'
export default {
  name: "landing-page",
  data: function() {
    return {
      serverUrl: '',
      jsonData: {},
      viewTags: []
    };
  },
  methods: {
    async jumpPage(input) {
      localStorage.setItem(KEY_SERVER_URL, input)
      this.$router.push("/swagger")
    },
    loadServerUrl(){
      this.serverUrl = localStorage.getItem(KEY_SERVER_URL) ||  "http://localhost:8080/v2/api-docs"
    }
    // end method
  },
  created(){
    this.loadServerUrl()
  }
};
</script>

