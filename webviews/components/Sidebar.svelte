<script lang="ts">
  var items: string[] = [];

  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.type) {
      case "updateContracts":
        items = message.value;
        break;
    }
  });

  function build(item: string) {
    tsvscode.postMessage({ type: "buildContract", value: item });
  }

  function deploy(item: string) {
    tsvscode.postMessage({ type: "deployContract", value: item });
  }

  function viewFile(item: string) {
    tsvscode.postMessage({ type: "viewContract", value: item });
  }
  tsvscode.postMessage({
    type: "getContracts",
    value: undefined,
  });
</script>

<button
  on:click={() => {
    tsvscode.postMessage({ type: "createContract", value: undefined });
  }}
  >Create contract
</button>

<button
  on:click={() => {
    tsvscode.postMessage({ type: "runContract", value: undefined });
  }}
  >Run contract
</button>

<button
  on:click={() => {
    tsvscode.postMessage({ type: "openTestExplorer", value: undefined });
  }}
  >Open test explorer
</button>
<div class="items">
  {#each items as item}
    <div class="item">
      <span>{item}</span>
      <div class="buttons">
        <button
          class="button icon build-icon build"
          on:click={() => build(item)}
        >
        </button>
        <button
          class="button icon deploy-icon deploy"
          on:click={() => deploy(item)}
        >
        </button>
        <button
          class="button icon view-icon view"
          on:click={() => viewFile(item)}
        >
        </button>
      </div>
    </div>
  {/each}
</div>
