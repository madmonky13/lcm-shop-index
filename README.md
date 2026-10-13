# LCM 4x4 shop index

A small list of the products on lcm4x4.co.uk, rebuilt every hour, for the shop pages' filters to read.

- Built by `build_index.py` from the public store list (`https://lcm4x4.co.uk/store?format=json`). No keys or passwords are used. Everything in it is already public on the website.
- Published by GitHub Pages:
  - `index.json` is the product list.
  - `summary.json` gives the counts.
- **Manual run:** Actions → "Build shop index" → Run workflow.
- **Safety:** if the store can't be read, or it returns fewer than 500 products or more than 20% fewer than last time, nothing is published. The shop then keeps using the last good list.
