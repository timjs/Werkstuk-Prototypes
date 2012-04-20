Door := Object clone

Door open := method(
    42 println)

LockedDoor := Door clone

LockedDoor isLocked := true

LockedDoor unlock := method(code,
    if(code == self code,
        isLocked = false))

LockedDoor open := method(
    if(isLocked,
        false println,
    #else
        super(open)))

safe := LockedDoor clone

safe code := 1234

safe unlock(4321)
safe open()
safe unlock(1234)
safe open()
