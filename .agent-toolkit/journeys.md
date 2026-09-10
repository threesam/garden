## browse-thoughts
- go to /
- expect text "threesam"
- expect link "thoughts"
- click "thoughts"
- expect heading "thoughts"
- expect link "the peach you have to taste it first."

## read-self
- go to /self
- expect heading "self"
- expect text "Trenton, New Jersey"
- expect link "anything but analog"

## play-wetyu
- go to /wetyu
- expect heading "wetyu"
- expect text "ms out"
- press "Shift+Digit3"
- expect text "recording bar" (a bar is 2 s; don't pin the number)
- press "KeyZ"
- press "Digit3" (listen key ends the take on the bar)
- expect text "recording bar" gone, then the drums state ending in "bar" or "bars" and its record button reading "rec"
- click "instructions"
- expect heading "how to play"
- click "close"
- expect button "hold drums"
