<script lang="ts">
  let content = "";
  window.addEventListener("message", (event) => {
    const message = event.data; // The JSON data our extension sent
    switch (message.type) {
      case "updateContent":
        content = content + "\n" + message.value;
        break;
      case "clearContent":
        content = "";
        break;
    }
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

<div>
  {content}
</div>
