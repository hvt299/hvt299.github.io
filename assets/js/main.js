const socket = io('https://webrtc-demo-8498ca83ad4d.herokuapp.com');

$('#div-chat').hide();
$('#div-chatbox').hide();

socket.on('DANH_SACH_ONLINE', o => {
    $('#div-chat').show();
    $('#div-chatbox').show();
    $('#div-dang-ky').hide();

    o.users.forEach(user => {
        const { ten, peerID } = user;
        $('#ulUser').append(`<li id="${peerID}">${ten}</li>`);
    });

    socket.on('CO_NGUOI_DUNG_MOI', user => {
        const { ten, peerID } = user;
        $('#ulUser').append(`<li id="${peerID}">${ten}</li>`);
    });

    socket.on('AI_DO_NGAT_KET_NOI', peerID => {
        $(`#${peerID}`).remove();
    });

    // o.messages.forEach(message => {
    //     document.getElementById("messages").textContent += message.username + ": " + message.message + "\n";
    // });

    socket.on('TIN_NHAN_MOI', message => {
        document.getElementById("messages").textContent += message.username + ": " + message.message + "\n";
    })
});

socket.on('DANG_KY_THAT_BAI', () => alert('Vui lòng chọn username khác!'));

let localStream;  // Biến để lưu stream local

function openStream() {
    const config = { audio: true, video: true };
    return navigator.mediaDevices.getUserMedia(config).then(stream => {
        localStream = stream;  // Lưu stream để có thể bật/tắt sau này
        return stream;
    });
}

// Thêm sự kiện cho nút tắt/mở camera
$('#btnToggleCamera').click(() => {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled; // Bật/tắt camera
        $('#btnToggleCamera').text(videoTrack.enabled ? 'Tắt Camera' : 'Mở Camera');
    }
});

// Thêm sự kiện cho nút tắt/mở mic
$('#btnToggleMic').click(() => {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled; // Bật/tắt mic
        $('#btnToggleMic').text(audioTrack.enabled ? 'Tắt Mic' : 'Mở Mic');
    }
});

function playStream(idVideoTag, stream) {
    const video = document.getElementById(idVideoTag);
    video.srcObject = stream;
    video.play();
}

// openStream()
// .then(stream => playStream('localStream', stream));

const peer = new Peer();

peer.on('open', id => {
    $('#my-peer').append(id);
    $('#btnSignUp').click(() => {
        const username = $('#txtUsername').val();
        if (username != null && username != "") {
            socket.emit('NGUOI_DUNG_DANG_KY', { ten: username, peerID: id });
        } else {
            alert('Username không thể bỏ trống!');
        }
    });
});

// Caller
$('#btnCall').click(() => {
    const id = $('#remoteID').val();
    openStream()
    .then(stream => {
        playStream('localStream', stream);
        const call = peer.call(id, stream);
        call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
    });
});

// Callee
peer.on('call', call => {
    openStream()
    .then(stream => {
        call.answer(stream);
        playStream('localStream', stream);
        call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
    });
});

$('#ulUser').on('click', 'li', function() {
    const id = $(this).attr('id');
    openStream()
    .then(stream => {
        playStream('localStream', stream);
        const call = peer.call(id, stream);
        call.on('stream', remoteStream => playStream('remoteStream', remoteStream));
    });
});

$('#btnSend').click(() => {
    const username = $('#txtUsername').val();
    const message = $('#yourMessage').val();
    if (message != null && message != "") {
        document.getElementById("yourMessage").value = "";
        document.getElementById("messages").textContent += "YOU: " + message + "\n";
        socket.emit("GUI_TIN_NHAN", {username: username, message: message});
    } else {
        alert('Tin nhắn không thể bỏ trống!');
    }
});