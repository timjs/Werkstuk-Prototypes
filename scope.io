
x := 1
g := block(
    x println
    x = 2)
f := block(
    # x = 3 geeft dynamic scope
    x := 3
    g call)
f call
x println
