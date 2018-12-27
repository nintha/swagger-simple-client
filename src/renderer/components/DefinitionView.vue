<template>
  <div>
    <div v-for="model in models">
      <JsxBox :data="model"></JsxBox>
      <br>
    </div>
  </div>
</template>
<script>
import JsxBox from "./JsxBox";
export default {
  components: {
    JsxBox
  },
  props: {
    definitions: Object,
    names: Array,
  },
  data: function() {
    return {
      models: []
    };
  },
  watch: {
    names: function(val, oldVal) {
      this.parseByNames(this.names);
    }
  },
  methods: {
    /**
     * 按名字递归解析实例定义
     */ 
    parseByNames(names) {
      const models = {};
      // 递归实体
      const func = modelName => {
        const definition = this.definitions[modelName];
        if(!definition){
          console.warn('cant find definition', modelName)
          return
        }
        const { vnode, otherModels } = this.parseDefinition(
          modelName,
          definition
        );

        models[modelName] = vnode;
        otherModels.forEach(item => {
          func(item);
        });
      };

      this.names.forEach(item => func(item));
      this.models = Object.values(models);
    },
    /**
     * 解析单个实例定义，子实例名会在结果中返回
     * @param name 实例名称
     * @param definition 定义源数据
     * @returns 
     *  vnode: 实例解析jsx数据
     *  otherModels: 子实例名称
     */ 
    parseDefinition(name, definition) {
      if (definition && definition.type === "object") {
        const props = definition.properties;
        const otherModels = [];
        const fields = Object.keys(props).map(field => {
          if (props[field].$ref) {
            otherModels.push(this.refToModel(props[field].$ref));
          }

          const fieldType =
            props[field].format ||
            props[field].type ||
            this.refToModel(props[field].$ref);
          return (
            <div>
              <b>{field}</b> ({fieldType}): <i>{props[field].description}</i>
            </div>
          );
        });
        return {
          vnode: (
            <div>
              <b>{name + " {"}</b>
              <div style={{ marginLeft: "2em" }}>{fields}</div>
              <b>{"}"}</b>
            </div>
          ),
          otherModels
        };
      } else {
        console.error("cant parse definition", definition);
        return {vnode:<div/>, otherModels:[]};
      }
    },
    /**
     * 实例引用名转换实例名称
     */
    refToModel(refName) {
      return refName.split("/")[2];
    }
  },
  created: function() {
    this.parseByNames(this.names);
  }
};
</script>

 