<template>
  <Card>
    <div slot="title">
      Swagger Simple Client
    </div>
    <Input
      search
      enter-button="Fetch"
      placeholder="Swagger Json URL..."
      v-model="jsonUrl"
      @on-search="jumpPage"
    />
  </Card>
</template>

<script>
export default {
  name: "landing-page",
  data: function() {
    return {
      jsonUrl: "http://localhost:8080/v2/api-docs",
      jsonData: {},
      viewTags: []
    };
  },
  methods: {
    async jumpPage(input) {
      localStorage.setItem("API_DOCS_URL", input)
      this.$router.push("/swagger")
    }
  }
};
</script>

