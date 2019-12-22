sudo fio --name=randwrite --ioengine=libaio --iodepth=1 --rw=randwrite --bs=4k --direct=0 --filename=/dev/vdb --size=4G --numjobs=4 --runtime=2400 --group_reporting
dd if=/dev/zero of=/dev/vdb bs=10M count=600 oflag=dsync
sudo fio --name=randread --ioengine=libaio --iodepth=16 --rw=randread --bs=4k --direct=0 --filename=/dev/vdb --size=4G --numjobs=4 --runtime=2400 --group_reporting
dd if=/dev/zero of=/dev/vdb bs=512 count=1000000 oflag=dsync
sudo fio --randrepeat=1 --ioengine=libaio --direct=1 --gtod_reduce=1 --name=test --filename=/dev/vdb --bs=4k --iodepth=64 --size=15G --readwrite=randrw --rwmixread=75
dd if=/dev/zero of=/dev/vdb bs=10M count=1000 oflag=dsync
