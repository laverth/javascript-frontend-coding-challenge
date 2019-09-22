import axios from "axios";

export default class Autocomplete {
  constructor(rootEl, options = {}) {
    options = Object.assign({ numOfResults: 10, endpointURL: ""}, options);
    Object.assign(this, { rootEl, options });
    this.selectedIndex = -1;
    document.addEventListener("keyup", this.checkKey.bind(this));
    this.results = [];
    this.init();
  }

  checkKey(event) {
    event = event || window.event;
    if (event.keyCode == "38") {
      // up arrow
      this.decreaseIndex();
    } else if (event.keyCode == "40") {
      // down arrow
      this.increaseIndex();
    } else if (event.keyCode == "13") {
      // enter
      this.selectIndex();
    }
    this.updateDropdown();
  }

  increaseIndex() {
    if (this.selectedIndex < this.results.length - 1) {
      this.selectedIndex += 1;
      this.changeInputToSelectedUser()
    }
  }
  
  decreaseIndex() {
    if (this.selectedIndex >= 0) {
      this.selectedIndex -= 1;
      this.changeInputToSelectedUser()
    }
  }
  
  selectIndex() {
    if (this.selectedIndex >= 0 && this.selectedIndex < this.results.length) {
      this.options.onSelect(this.results[this.selectedIndex].text)
    }
  }
  
  changeInputToSelectedUser(){    
    this.inputEl.value = this.results[this.selectedIndex].text;
  }

  async onQueryChange(query) {
    // Get data for the dropdown

    let results = await this.getResults(query);
    this.results = results.slice(0, this.options.numOfResults);
    this.selectedIndex = -1;
    this.updateDropdown();
  }

  /**
   * Given an array and a query, return a filtered array based on the query.
   */
  async getResults(query) {
    if (!query) return [];
    if (this.options.endpointURL) {
      const wes = await axios(this.options.endpointURL.concat(query));
      if (wes.status === 200) {
        return wes.data.items.map(item => {
          const mappedItem = {
            text: item.login,
            value: item.id
          };

          return mappedItem;
        });
      }
    } else if (this.options.data) {
      return this.options.data.filter(item =>
        item.text.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  updateDropdown() {
    this.listEl.innerHTML = "";
    this.listEl.appendChild(this.createResultsEl());
  }

  createResultsEl() {
    const fragment = document.createDocumentFragment();
    let index = -1;
    this.results.forEach(result => {
      index += 1;
      const el = document.createElement("li");

      Object.assign(el, {
        className: index === this.selectedIndex ? "selected-result" : "result",
        textContent: result.text
      });

      // Pass the value to the onSelect callback
      el.addEventListener("click", event => {
        const { onSelect } = this.options;
        if (typeof onSelect === "function") onSelect(result.value);
      });

      fragment.appendChild(el);
    });
    return fragment;
  }

  createQueryInputEl() {
    const inputEl = document.createElement("input");
    Object.assign(inputEl, {
      type: "search",
      name: "query",
      autocomplete: "off"
    });

    inputEl.addEventListener("input", event =>
      this.onQueryChange(event.target.value)
    );

    return inputEl;
  }

  init() {
    // Build query input
    this.inputEl = this.createQueryInputEl();
    this.rootEl.appendChild(this.inputEl);

    // Build results dropdown
    this.listEl = document.createElement("ul");
    Object.assign(this.listEl, { className: "results" });
    this.rootEl.appendChild(this.listEl);
  }
}
